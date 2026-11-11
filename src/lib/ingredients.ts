import { query } from "@/src/lib/db";

const KJ_PER_KCAL = 4.184;

export type SavedIngredient = {
  id: number;
  name: string;
  kcal: number | null;
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

export async function listSavedIngredients(userId: string) {
  const result = await query<{ id: number; name: string | null; energy_kj: string | null }>(
    `SELECT
       f.id,
       NULLIF(btrim(f.name_en), '') AS name,
       v.value::text AS energy_kj
     FROM saved_ingredient s
     JOIN fineli_food f ON f.id = s.food_id
     LEFT JOIN fineli_component_value v
       ON v.food_id = f.id AND v.component = 'ENERC'
     WHERE s.user_id = $1
     ORDER BY s.saved_at DESC, f.id ASC`,
    [userId],
  );

  return result.rows.flatMap((row) => {
    if (!row.name) {
      return [];
    }

    return [{ id: row.id, name: row.name, kcal: kcalFromKj(row.energy_kj) }];
  });
}

export async function isIngredientSaved(userId: string, foodId: number) {
  const result = await query(
    `SELECT 1 AS saved
     FROM saved_ingredient
     WHERE user_id = $1 AND food_id = $2`,
    [userId, foodId],
  );

  return result.rows.length > 0;
}

export async function saveIngredient(userId: string, foodId: number) {
  const food = await query("SELECT 1 AS found FROM fineli_food WHERE id = $1", [foodId]);
  if (!food.rows[0]) {
    return "missing" as const;
  }

  await query(
    `INSERT INTO saved_ingredient (user_id, food_id)
     VALUES ($1, $2)
     ON CONFLICT (user_id, food_id) DO NOTHING`,
    [userId, foodId],
  );

  return "saved" as const;
}
