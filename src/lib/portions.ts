import { randomUUID } from "node:crypto";
import type { FoodListEntry } from "@/src/components/food-list/food-row";
import { query } from "@/src/lib/db";
import type { FoodNutrient } from "@/src/lib/food-search";

const KJ_PER_KCAL = 4.184;
const PORTION_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const DETAIL_NUTRIENTS = [
  { code: "FAT", label: "Fat", kcalPerGram: 9 },
  { code: "PROT", label: "Protein", kcalPerGram: 4 },
  { code: "CHOAVL", label: "Carbs", kcalPerGram: 4 },
] as const;

export type PortionHit = {
  id: string;
  name: string;
  grams: number;
  kcal: number | null;
  foodId: number;
  foodName: string;
  foodUseClass: string | null;
  foodUseParent: string | null;
};

export type PortionDetail = PortionHit & {
  gramsLabel: string;
  nutrients: FoodNutrient[];
};

type PortionRow = {
  id: string;
  name: string;
  grams: string;
  food_id: number;
  food_name: string | null;
  energy_kj: string | null;
  food_use_class: string | null;
  food_use_parent: string | null;
};

function kcalFromKj(value: string | null) {
  if (value === null) {
    return null;
  }

  const kj = Number(value);
  if (!Number.isFinite(kj)) {
    return null;
  }

  return Math.round(kj / KJ_PER_KCAL);
}

function scaleKcal(per100: number | null, grams: number) {
  if (per100 === null) {
    return null;
  }

  return Math.round((per100 * grams) / 100);
}

function amountLabel(value: number) {
  const text = new Intl.NumberFormat("en", { maximumFractionDigits: 1 }).format(value);
  return `${text} g`;
}

function shareLabel(value: number, kcalPerGram: number, kcal: number | null) {
  if (kcal === null || kcal <= 0) {
    return null;
  }

  return `${Math.round((value * kcalPerGram * 100) / kcal)}%`;
}

export function gramsLabel(grams: number) {
  const text = new Intl.NumberFormat("en", { maximumFractionDigits: 2 }).format(grams);
  return `${text} g`;
}

export function portionId(value: string) {
  if (!PORTION_ID.test(value)) {
    return null;
  }

  return value.toLowerCase();
}

export function portionName(value: string) {
  const name = value.trim().replace(/\s+/g, " ");
  if (name.length < 1 || name.length > 80) {
    return null;
  }

  return name;
}

export function portionGrams(value: string) {
  const text = value.trim().replace(",", ".");
  if (!/^\d{1,4}(\.\d{1,2})?$/.test(text)) {
    return null;
  }

  const grams = Number(text);
  if (!Number.isFinite(grams) || grams <= 0) {
    return null;
  }

  return grams;
}

function hitFromRow(row: PortionRow): PortionHit | null {
  const grams = Number(row.grams);
  if (!row.food_name || !Number.isFinite(grams) || grams <= 0) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    grams,
    kcal: scaleKcal(kcalFromKj(row.energy_kj), grams),
    foodId: row.food_id,
    foodName: row.food_name,
    foodUseClass: row.food_use_class,
    foodUseParent: row.food_use_parent,
  };
}

const PORTION_SELECT = `
  SELECT
    p.id,
    p.name,
    p.grams::text AS grams,
    p.food_id,
    NULLIF(btrim(f.name_en), '') AS food_name,
    v.value::text AS energy_kj,
    c.name AS food_use_class,
    c.parent_name AS food_use_parent
  FROM portion p
  JOIN fineli_food f ON f.id = p.food_id
  LEFT JOIN fineli_component_value v
    ON v.food_id = f.id AND v.component = 'ENERC'
  LEFT JOIN fineli_food_use_class c
    ON c.code = f.food_use_class
`;

export function portionEntry(portion: PortionHit): FoodListEntry {
  const weight = gramsLabel(portion.grams);

  return {
    id: portion.foodId,
    listKey: `portion:${portion.id}`,
    href: `/portions/${portion.id}`,
    name: portion.name,
    kcal: portion.kcal,
    foodUseClass: portion.foodUseClass,
    foodUseParent: portion.foodUseParent,
    gramsLabel: weight,
    idLabel: weight,
    kind: "portion",
    portionId: portion.id,
  };
}

export async function searchPortions(userId: string, term: string) {
  const trimmed = term.trim();
  if (!trimmed || trimmed.length > 80) {
    return [];
  }

  const result = await query<PortionRow>(
    `${PORTION_SELECT}
     WHERE p.user_id = $1
       AND (
         strpos(lower(p.name), lower($2)) > 0
         OR strpos(lower(f.name_en), lower($2)) > 0
         OR strpos(lower(f.name_fi), lower($2)) > 0
         OR strpos(lower(f.name_sv), lower($2)) > 0
       )
     ORDER BY p.created_at DESC
     LIMIT 40`,
    [userId, trimmed],
  );

  return result.rows.flatMap((row) => {
    const hit = hitFromRow(row);
    return hit ? [hit] : [];
  });
}

export async function listPortions(userId: string) {
  const result = await query<PortionRow>(
    `${PORTION_SELECT}
     WHERE p.user_id = $1
     ORDER BY p.created_at DESC`,
    [userId],
  );

  return result.rows.flatMap((row) => {
    const hit = hitFromRow(row);
    return hit ? [hit] : [];
  });
}

export async function getPortion(userId: string, id: string): Promise<PortionDetail | null> {
  const result = await query<PortionRow>(
    `${PORTION_SELECT}
     WHERE p.id = $1 AND p.user_id = $2`,
    [id, userId],
  );
  const hit = result.rows[0] ? hitFromRow(result.rows[0]) : null;
  if (!hit) {
    return null;
  }

  const per100Kcal = kcalFromKj(result.rows[0]?.energy_kj ?? null);
  const values = await query<{ component: string; value: string | null }>(
    `SELECT component, value::text AS value
     FROM fineli_component_value
     WHERE food_id = $1 AND component = ANY($2::text[])`,
    [hit.foodId, DETAIL_NUTRIENTS.map((item) => item.code)],
  );
  const byCode = new Map(values.rows.map((item) => [item.component, item.value]));

  return {
    ...hit,
    gramsLabel: gramsLabel(hit.grams),
    nutrients: DETAIL_NUTRIENTS.flatMap((item) => {
      const raw = byCode.get(item.code);
      if (raw === undefined || raw === null) {
        return [];
      }

      const per100 = Number(raw);
      if (!Number.isFinite(per100)) {
        return [];
      }

      return [
        {
          label: item.label,
          amount: amountLabel((per100 * hit.grams) / 100),
          share: shareLabel(per100, item.kcalPerGram, per100Kcal),
        },
      ];
    }),
  };
}

export async function createPortion(userId: string, foodId: number, name: string, grams: number) {
  const food = await query("SELECT 1 AS found FROM fineli_food WHERE id = $1", [foodId]);
  if (!food.rows[0]) {
    return null;
  }

  const id = randomUUID();
  await query(
    `INSERT INTO portion (id, user_id, food_id, name, grams)
     VALUES ($1, $2, $3, $4, $5)`,
    [id, userId, foodId, name, grams],
  );

  return id;
}

export async function removePortion(userId: string, id: string) {
  await query(
    `DELETE FROM portion
     WHERE id = $1 AND user_id = $2`,
    [id, userId],
  );
}
