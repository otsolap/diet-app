import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { withTransaction } from "../src/lib/db.ts";

const RELEASE = "20";
const ZIP_NAME = "Fineli_Rel20.zip";
const VALUE_BATCH = 10000;

type NameRow = {
  id: number;
  en: string;
  fi: string;
  sv: string;
  foodUseClass: string;
};

type FoodUseClassRow = {
  code: string;
  name: string;
  parentCode: string;
  parentName: string;
};

function readTable(dir: string, file: string) {
  const text = readFileSync(join(dir, file), "latin1");
  const lines = text.split(/\r?\n/).filter((line) => line.length > 0);
  const header = lines[0]?.split(";") ?? [];
  const rows = lines.slice(1).map((line) => line.split(";"));
  return { header, rows };
}

function expectHeader(header: string[], expected: string[], file: string) {
  const same =
    header.length === expected.length && header.every((column, index) => column === expected[index]);
  if (!same) {
    throw new Error(`${file} is not a Fineli basic package 1 file.`);
  }
}

function foodId(raw: string | undefined) {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("A Fineli food id is not valid.");
  }

  return id;
}

function componentValue(raw: string | undefined) {
  const trimmed = raw?.trim() ?? "";
  if (!trimmed) {
    return "";
  }

  const normalized = trimmed.replace(",", ".");
  if (!/^-?\d+(\.\d+)?$/.test(normalized)) {
    throw new Error("A Fineli component value is not a number.");
  }

  return normalized;
}

function addNames(
  names: Map<number, NameRow>,
  rows: string[][],
  key: "en" | "fi" | "sv",
  lang: string,
) {
  for (const row of rows) {
    const id = foodId(row[0]);
    if (row[2] !== lang) {
      throw new Error("A Fineli food name has the wrong language.");
    }

    const item = names.get(id) ?? { id, en: "", fi: "", sv: "", foodUseClass: "" };
    item[key] = row[1]?.trim() ?? "";
    names.set(id, item);
  }
}

async function main() {
  const root = fileURLToPath(new URL("..", import.meta.url));
  const zip = join(root, "data", "fineli", ZIP_NAME);
  const dir = mkdtempSync(join(tmpdir(), "fineli-"));

  try {
    execFileSync("unzip", ["-q", "-o", zip, "-d", dir], { stdio: "pipe" });

    const english = readTable(dir, "foodname_EN.csv");
    const finnish = readTable(dir, "foodname_FI.csv");
    const swedish = readTable(dir, "foodname_SV.csv");
    const values = readTable(dir, "component_value.csv");
    expectHeader(english.header, ["FOODID", "FOODNAME", "LANG"], "foodname_EN.csv");
    expectHeader(finnish.header, ["FOODID", "FOODNAME", "LANG"], "foodname_FI.csv");
    expectHeader(swedish.header, ["FOODID", "FOODNAME", "LANG"], "foodname_SV.csv");
    expectHeader(
      values.header,
      ["FOODID", "EUFDNAME", "BESTLOC", "ACQTYPE", "METHTYPE", "METHIND"],
      "component_value.csv",
    );

    const names = new Map<number, NameRow>();
    addNames(names, english.rows, "en", "EN");
    addNames(names, finnish.rows, "fi", "FI");
    addNames(names, swedish.rows, "sv", "SV");

    const classes = readTable(dir, "fuclass_EN.csv");
    const foodRows = readTable(dir, "food.csv");
    expectHeader(classes.header, ["THSCODE", "DESCRIPT", "LANG"], "fuclass_EN.csv");
    expectHeader(
      foodRows.header,
      ["FOODID", "FOODNAME", "FOODTYPE", "PROCESS", "EDPORT", "IGCLASS", "IGCLASSP", "FUCLASS", "FUCLASSP"],
      "food.csv",
    );

    const classNames = new Map<string, string>();
    for (const row of classes.rows) {
      const code = row[0]?.trim() ?? "";
      const name = row[1]?.trim() ?? "";
      if (!code || !name || row[2] !== "EN") {
        throw new Error("A Fineli food use class is not valid.");
      }
      classNames.set(code, name);
    }

    const foodUseById = new Map<number, { code: string; parentCode: string }>();
    for (const row of foodRows.rows) {
      const id = foodId(row[0]);
      const code = row[7]?.trim() ?? "";
      const parentCode = row[8]?.trim() ?? "";
      if (!names.has(id) || !code || !parentCode) {
        throw new Error("A Fineli food has no food use class.");
      }
      foodUseById.set(id, { code, parentCode });
    }

    for (const food of names.values()) {
      const use = foodUseById.get(food.id);
      if (!use) {
        throw new Error("A Fineli food has no food use class.");
      }
      food.foodUseClass = use.code;
    }

    const foodUseClasses: FoodUseClassRow[] = [];
    const seenClasses = new Set<string>();
    for (const use of foodUseById.values()) {
      if (seenClasses.has(use.code)) {
        continue;
      }
      seenClasses.add(use.code);
      foodUseClasses.push({
        code: use.code,
        name: classNames.get(use.code) ?? use.code,
        parentCode: use.parentCode,
        parentName: classNames.get(use.parentCode) ?? use.parentCode,
      });
    }

    const foods = [...names.values()];
    const componentRows = values.rows.map((row) => {
      const id = foodId(row[0]);
      if (!names.has(id)) {
        throw new Error("A component value has no food.");
      }

      const component = row[1]?.trim() ?? "";
      if (!component) {
        throw new Error("A component code is missing.");
      }

      return { id, component, value: componentValue(row[2]) };
    });

    await withTransaction(async (sql) => {
      await sql("TRUNCATE fineli_component_value, fineli_release");
      await sql(
        `INSERT INTO fineli_food_use_class (code, name, parent_code, parent_name)
         SELECT * FROM UNNEST($1::text[], $2::text[], $3::text[], $4::text[])
         ON CONFLICT (code) DO UPDATE
         SET name = EXCLUDED.name,
             parent_code = EXCLUDED.parent_code,
             parent_name = EXCLUDED.parent_name`,
        [
          foodUseClasses.map((row) => row.code),
          foodUseClasses.map((row) => row.name),
          foodUseClasses.map((row) => row.parentCode),
          foodUseClasses.map((row) => row.parentName),
        ],
      );
      await sql(
        `INSERT INTO fineli_food (id, name_en, name_fi, name_sv, food_use_class)
         SELECT * FROM UNNEST($1::int[], $2::text[], $3::text[], $4::text[], $5::text[])
         ON CONFLICT (id) DO UPDATE
         SET name_en = EXCLUDED.name_en,
             name_fi = EXCLUDED.name_fi,
             name_sv = EXCLUDED.name_sv,
             food_use_class = EXCLUDED.food_use_class`,
        [
          foods.map((food) => food.id),
          foods.map((food) => food.en),
          foods.map((food) => food.fi),
          foods.map((food) => food.sv),
          foods.map((food) => food.foodUseClass),
        ],
      );
      await sql(
        `DELETE FROM fineli_food
         WHERE NOT (id = ANY($1::int[]))
           AND NOT EXISTS (
             SELECT 1 FROM saved_ingredient WHERE saved_ingredient.food_id = fineli_food.id
           )`,
        [foods.map((food) => food.id)],
      );

      for (let index = 0; index < componentRows.length; index += VALUE_BATCH) {
        const slice = componentRows.slice(index, index + VALUE_BATCH);
        await sql(
          `INSERT INTO fineli_component_value (food_id, component, value)
           SELECT id, component, NULLIF(raw, '')::numeric
           FROM UNNEST($1::int[], $2::text[], $3::text[]) AS row(id, component, raw)`,
          [
            slice.map((row) => row.id),
            slice.map((row) => row.component),
            slice.map((row) => row.value),
          ],
        );
      }

      await sql("INSERT INTO fineli_release (release) VALUES ($1)", [RELEASE]);
    });

    console.log(
      `Loaded Fineli release ${RELEASE}: ${foods.length} foods, ${componentRows.length} component values.`,
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Import failed.");
  process.exitCode = 1;
});
