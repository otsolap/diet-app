import { query } from "@/src/lib/db";

const SEARCH_LIMIT = 80;
const KJ_PER_KCAL = 4.184;
export const FOOD_PAGE_SIZE = 20;

const FOOD_NAME_SQL = `NULLIF(btrim(f.name_en), '')`;

const FOOD_MATCH_SQL = `(
  strpos(lower(f.name_en), lower($1)) > 0
  OR strpos(lower(f.name_fi), lower($1)) > 0
  OR strpos(lower(f.name_sv), lower($1)) > 0
) AND ${FOOD_NAME_SQL} IS NOT NULL`;

export type FoodListItem = {
  id: number;
  name: string;
  kcal: number | null;
  foodUseClass: string | null;
  foodUseParent: string | null;
};

export type FoodSearchResult =
  | { foods: FoodListItem[]; total: number; page: number; pageCount: number }
  | { error: string };

export type FoodNutrient = {
  label: string;
  amount: string;
  share: string | null;
};

export type FoodDetail = {
  id: number;
  name: string;
  kcal: number | null;
  foodUseClass: string | null;
  nutrients: FoodNutrient[];
};

export type FoodDetailResult = { food: FoodDetail } | { missing: true } | { error: string };

const DETAIL_NUTRIENTS = [
  { code: "FAT", label: "Fat", kcalPerGram: 9 },
  { code: "PROT", label: "Protein", kcalPerGram: 4 },
  { code: "CHOAVL", label: "Carbs", kcalPerGram: 4 },
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
  food_use_class: string | null;
  food_use_parent: string | null;
};

type FoodNameRow = {
  id: number;
  name_en: string;
  energy_kj: string | null;
  food_use_class: string | null;
};

type NutrientRow = {
  component: string;
  value: string | null;
};

function grams(value: string | null) {
  if (value === null) {
    return null;
  }

  const number = Number(value);
  if (!Number.isFinite(number)) {
    return null;
  }

  return number;
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
         v.value AS energy_kj,
         c.name AS food_use_class,
         c.parent_name AS food_use_parent
       FROM fineli_food f
       LEFT JOIN fineli_component_value v
         ON v.food_id = f.id AND v.component = 'ENERC'
       LEFT JOIN fineli_food_use_class c
         ON c.code = f.food_use_class
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

        return [{
          id: row.id,
          name: row.name,
          kcal: kcalFromKj(row.energy_kj),
          foodUseClass: row.food_use_class,
          foodUseParent: row.food_use_parent,
        }];
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
         v.value AS energy_kj,
         c.name AS food_use_class
       FROM fineli_food f
       LEFT JOIN fineli_component_value v
         ON v.food_id = f.id AND v.component = 'ENERC'
       LEFT JOIN fineli_food_use_class c
         ON c.code = f.food_use_class
       WHERE f.id = $1`,
      [id],
    );
    const row = found.rows[0];
    if (!row) {
      return { missing: true };
    }

    const name = row.name_en.trim();
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
    const kcal = kcalFromKj(row.energy_kj);

    return {
      food: {
        id: row.id,
        name,
        kcal,
        foodUseClass: row.food_use_class,
        nutrients: DETAIL_NUTRIENTS.flatMap((item) => {
          const value = grams(byCode.get(item.code) ?? null);
          if (value === null) {
            return [];
          }

          return [
            {
              label: item.label,
              amount: amountLabel(value),
              share: shareLabel(value, item.kcalPerGram, kcal),
            },
          ];
        }),
      },
    };
  } catch {
    return { error: "Food data is not available." };
  }
}
