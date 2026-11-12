import { query } from "@/src/lib/db";
import { kcalFromKj } from "@/src/lib/nutrition";

export type SavedIngredient = {
  id: number;
  name: string;
  kcal: number | null;
  foodUseClass: string | null;
  foodUseParent: string | null;
};

export async function listSavedIngredients(userId: string) {
  const result = await query<{
    id: number;
    name: string | null;
    energy_kj: string | null;
    food_use_class: string | null;
    food_use_parent: string | null;
  }>(
    `SELECT
       f.id,
       NULLIF(btrim(f.name_en), '') AS name,
       v.value::text AS energy_kj,
       c.name AS food_use_class,
       c.parent_name AS food_use_parent
     FROM saved_ingredient s
     JOIN fineli_food f ON f.id = s.food_id
     LEFT JOIN fineli_component_value v
       ON v.food_id = f.id AND v.component = 'ENERC'
     LEFT JOIN fineli_food_use_class c
       ON c.code = f.food_use_class
     WHERE s.user_id = $1
     ORDER BY s.saved_at DESC, f.id ASC`,
    [userId],
  );

  return result.rows.flatMap((row) => {
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
  });
}

export async function listSavedFoodIds(userId: string) {
  const result = await query<{ food_id: number }>(
    `SELECT food_id
     FROM saved_ingredient
     WHERE user_id = $1`,
    [userId],
  );

  return result.rows.map((row) => row.food_id);
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

export async function removeIngredient(userId: string, foodId: number) {
  await query(
    `DELETE FROM saved_ingredient
     WHERE user_id = $1 AND food_id = $2`,
    [userId, foodId],
  );
}
