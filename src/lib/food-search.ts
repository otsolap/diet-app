import { query } from "@/src/lib/db";

const SEARCH_LIMIT = 80;
const KJ_PER_KCAL = 4.184;
export const FOOD_PAGE_SIZE = 20;

const FOOD_NAME_SQL = `COALESCE(
  NULLIF(btrim(f.name_en), ''),
  NULLIF(btrim(f.name_fi), ''),
  NULLIF(btrim(f.name_sv), '')
)`;

const FOOD_MATCH_SQL = `(
  strpos(lower(f.name_en), lower($1)) > 0
  OR strpos(lower(f.name_fi), lower($1)) > 0
  OR strpos(lower(f.name_sv), lower($1)) > 0
) AND ${FOOD_NAME_SQL} IS NOT NULL`;

export type FoodListItem = {
  id: number;
  name: string;
  kcal: number | null;
};

export type FoodSearchResult =
  | { foods: FoodListItem[]; total: number; page: number; pageCount: number }
  | { error: string };

export type FoodNutrient = {
  label: string;
  amount: string;
};

export type FoodDetail = {
  id: number;
  name: string;
  otherNames: string[];
  kcal: number | null;
  nutrients: FoodNutrient[];
};

export type FoodDetailResult = { food: FoodDetail } | { missing: true } | { error: string };

const DETAIL_NUTRIENTS = [
  { code: "ENERC", label: "Energy", unit: "kJ" },
  { code: "FAT", label: "Fat", unit: "g" },
  { code: "FASAT", label: "Saturated fat", unit: "g" },
  { code: "CHOAVL", label: "Carbohydrate", unit: "g" },
  { code: "SUGAR", label: "Sugars", unit: "g" },
  { code: "FIBC", label: "Fibre", unit: "g" },
  { code: "PROT", label: "Protein", unit: "g" },
  { code: "NACL", label: "Salt", unit: "mg" },
] as const;

type ReadyRow = {
  ready: boolean;
};

type CountRow = {
  total: string;
};

type FoodRow = {
  id: number;
  name: string | null;
  energy_kj: string | null;
};

type FoodNameRow = {
  id: number;
  name_en: string;
  name_fi: string;
  name_sv: string;
  energy_kj: string | null;
};

type NutrientRow = {
  component: string;
  value: string | null;
};

function displayName(english: string, finnish: string, swedish: string) {
  return english.trim() || finnish.trim() || swedish.trim();
}

function otherNames(title: string, names: string[]) {
  const seen = new Set([title.toLowerCase()]);
  return names.flatMap((name) => {
    const trimmed = name.trim();
    const key = trimmed.toLowerCase();
    if (!trimmed || seen.has(key)) {
      return [];
    }

    seen.add(key);
    return [trimmed];
  });
}

function amountLabel(value: string | null, unit: string) {
  if (value === null) {
    return null;
  }

  const number = Number(value);
  if (!Number.isFinite(number)) {
    return null;
  }

  const text = new Intl.NumberFormat("en", { maximumFractionDigits: 1 }).format(number);
  return `${text} ${unit}`;
}

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

function requestedPage(page: number) {
  if (!Number.isInteger(page) || page < 1) {
    return 1;
  }

  return page;
}

export async function searchFoods(term: string, page = 1): Promise<FoodSearchResult> {
  const trimmed = term.trim();
  if (!trimmed) {
    return { error: "Enter a search term." };
  }

  if (trimmed.length > SEARCH_LIMIT) {
    return { error: "Use a shorter search term." };
  }

  try {
    const ready = await query<ReadyRow>(
      "SELECT EXISTS (SELECT 1 FROM fineli_food) AS ready",
    );
    if (!ready.rows[0]?.ready) {
      return { error: "Food data is not loaded." };
    }

    const counted = await query<CountRow>(
      `SELECT count(*)::text AS total
       FROM fineli_food f
       WHERE ${FOOD_MATCH_SQL}`,
      [trimmed],
    );
    const total = Number(counted.rows[0]?.total ?? 0);
    if (!Number.isSafeInteger(total) || total < 0) {
      return { error: "Food data is not available." };
    }

    const pageCount = total === 0 ? 0 : Math.ceil(total / FOOD_PAGE_SIZE);
    const current = pageCount === 0 ? 1 : Math.min(requestedPage(page), pageCount);
    if (total === 0) {
      return { foods: [], total, page: current, pageCount };
    }

    const found = await query<FoodRow>(
      `SELECT
         f.id,
         ${FOOD_NAME_SQL} AS name,
         v.value AS energy_kj
       FROM fineli_food f
       LEFT JOIN fineli_component_value v
         ON v.food_id = f.id AND v.component = 'ENERC'
       WHERE ${FOOD_MATCH_SQL}
       ORDER BY
         CASE
           WHEN starts_with(lower(f.name_en), lower($1))
             OR starts_with(lower(f.name_fi), lower($1))
             OR starts_with(lower(f.name_sv), lower($1))
           THEN 0
           ELSE 1
         END,
         lower(${FOOD_NAME_SQL})
       LIMIT $2 OFFSET $3`,
      [trimmed, FOOD_PAGE_SIZE, (current - 1) * FOOD_PAGE_SIZE],
    );

    return {
      foods: found.rows.flatMap((row) => {
        if (!row.name) {
          return [];
        }

        return [{ id: row.id, name: row.name, kcal: kcalFromKj(row.energy_kj) }];
      }),
      total,
      page: current,
      pageCount,
    };
  } catch {
    return { error: "Food data is not available." };
  }
}

export function foodId(value: string) {
  if (!/^[1-9]\d{0,9}$/.test(value)) {
    return null;
  }

  const id = Number(value);
  if (!Number.isSafeInteger(id) || id > 2147483647) {
    return null;
  }

  return id;
}

export async function getFood(id: number): Promise<FoodDetailResult> {
  try {
    const found = await query<FoodNameRow>(
      `SELECT
         f.id,
         f.name_en,
         f.name_fi,
         f.name_sv,
         v.value AS energy_kj
       FROM fineli_food f
       LEFT JOIN fineli_component_value v
         ON v.food_id = f.id AND v.component = 'ENERC'
       WHERE f.id = $1`,
      [id],
    );
    const row = found.rows[0];
    if (!row) {
      return { missing: true };
    }

    const name = displayName(row.name_en, row.name_fi, row.name_sv);
    if (!name) {
      return { missing: true };
    }

    const values = await query<NutrientRow>(
      `SELECT component, value::text AS value
       FROM fineli_component_value
       WHERE food_id = $1 AND component = ANY($2::text[])`,
      [id, DETAIL_NUTRIENTS.map((item) => item.code)],
    );
    const byCode = new Map(values.rows.map((item) => [item.component, item.value]));

    return {
      food: {
        id: row.id,
        name,
        otherNames: otherNames(name, [row.name_fi, row.name_sv]),
        kcal: kcalFromKj(row.energy_kj),
        nutrients: DETAIL_NUTRIENTS.flatMap((item) => {
          const amount = amountLabel(byCode.get(item.code) ?? null, item.unit);
          return amount ? [{ label: item.label, amount }] : [];
        }),
      },
    };
  } catch {
    return { error: "Food data is not available." };
  }
}
