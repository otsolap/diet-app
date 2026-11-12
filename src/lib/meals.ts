import { randomUUID } from "node:crypto";
import { query, withTransaction } from "@/src/lib/db";
import { gramsLabel } from "@/src/lib/portions";

const KJ_PER_KCAL = 4.184;
const MEAL_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NUTRIENT_CODES = ["FAT", "PROT", "CHOAVL"] as const;

export type MealChoice = {
  value: string;
  name: string;
  detail: string;
  group: "Ingredients" | "Portions";
};

export type MealLine = {
  id: string;
  name: string;
  href: string;
  quantity: number;
  baseLabel: string;
  kcal: number | null;
  fat: number | null;
  protein: number | null;
  carbs: number | null;
  foodUseClass: string | null;
};

export type MealDetail = {
  id: string;
  name: string;
  lines: MealLine[];
  kcal: number | null;
  fat: number | null;
  protein: number | null;
  carbs: number | null;
};

export type MealSummary = {
  id: string;
  name: string;
  items: number;
  kcal: number | null;
};

type ItemRef = { kind: "food"; id: number } | { kind: "portion"; id: string };

type NutrientRow = {
  food_id: number;
  component: string;
  value: string | null;
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

function finite(value: string | null) {
  if (value === null) {
    return null;
  }

  const number = Number(value);
  if (!Number.isFinite(number)) {
    return null;
  }

  return number;
}

function scale(per100: number | null, grams: number | null) {
  if (per100 === null) {
    return null;
  }

  if (grams === null) {
    return per100;
  }

  return (per100 * grams) / 100;
}

function lineTotal(unit: number | null, quantity: number) {
  if (unit === null) {
    return null;
  }

  return unit * quantity;
}

export function mealId(value: string) {
  if (!MEAL_ID.test(value)) {
    return null;
  }

  return value.toLowerCase();
}

export function mealName(value: string) {
  const name = value.trim().replace(/\s+/g, " ");
  if (name.length < 1 || name.length > 80) {
    return null;
  }

  return name;
}

export function mealQuantity(value: string) {
  if (!/^[1-9]\d?$/.test(value)) {
    return null;
  }

  return Number(value);
}

export function mealItemRef(value: string): ItemRef | null {
  const food = /^food:([1-9]\d{0,9})$/.exec(value);
  if (food) {
    const id = Number(food[1]);
    if (!Number.isSafeInteger(id) || id > 2147483647) {
      return null;
    }

    return { kind: "food", id };
  }

  const portion = /^portion:([0-9a-f-]{36})$/i.exec(value);
  if (!portion) {
    return null;
  }

  const id = mealId(portion[1]);
  if (!id) {
    return null;
  }

  return { kind: "portion", id };
}

function sum(values: Array<number | null>) {
  let total = 0;
  for (const value of values) {
    if (value === null) {
      return null;
    }

    total += value;
  }

  return total;
}

export async function listMealChoices(userId: string) {
  const foods = await query<{ id: number; name: string | null }>(
    `SELECT f.id, NULLIF(btrim(f.name_en), '') AS name
     FROM saved_ingredient s
     JOIN fineli_food f ON f.id = s.food_id
     WHERE s.user_id = $1
     ORDER BY f.name_en ASC, f.id ASC`,
    [userId],
  );
  const portions = await query<{ id: string; name: string; grams: string }>(
    `SELECT id, name, grams::text AS grams
     FROM portion
     WHERE user_id = $1
     ORDER BY name ASC, created_at ASC`,
    [userId],
  );

  const choices: MealChoice[] = [];
  for (const food of foods.rows) {
    if (!food.name) {
      continue;
    }

    choices.push({
      value: `food:${food.id}`,
      name: food.name,
      detail: "100 g",
      group: "Ingredients",
    });
  }

  for (const portion of portions.rows) {
    const grams = Number(portion.grams);
    if (!Number.isFinite(grams) || grams <= 0) {
      continue;
    }

    choices.push({
      value: `portion:${portion.id}`,
      name: portion.name,
      detail: gramsLabel(grams),
      group: "Portions",
    });
  }

  return choices;
}

async function nutrientMap(foodIds: number[]) {
  const map = new Map<number, { fat: number | null; protein: number | null; carbs: number | null; kcal: number | null }>();
  if (foodIds.length === 0) {
    return map;
  }

  const rows = await query<NutrientRow>(
    `SELECT food_id, component, value::text AS value
     FROM fineli_component_value
     WHERE food_id = ANY($1::int[])
       AND component = ANY($2::text[])`,
    [foodIds, ["ENERC", ...NUTRIENT_CODES]],
  );

  for (const id of foodIds) {
    map.set(id, { fat: null, protein: null, carbs: null, kcal: null });
  }

  for (const row of rows.rows) {
    const current = map.get(row.food_id);
    if (!current) {
      continue;
    }

    if (row.component === "ENERC") {
      current.kcal = kcalFromKj(row.value);
    }

    if (row.component === "FAT") {
      current.fat = finite(row.value);
    }

    if (row.component === "PROT") {
      current.protein = finite(row.value);
    }

    if (row.component === "CHOAVL") {
      current.carbs = finite(row.value);
    }
  }

  return map;
}

type RawItem = {
  id: string;
  quantity: number;
  food_id: number | null;
  portion_id: string | null;
  name: string | null;
  grams: string | null;
  source_food_id: number | null;
  food_use_class: string | null;
};

async function linesFor(items: RawItem[]) {
  const foodIds = [...new Set(items.flatMap((item) => (item.source_food_id === null ? [] : [item.source_food_id])))];
  const nutrients = await nutrientMap(foodIds);

  return items.flatMap((item) => {
    if (!item.name || item.source_food_id === null) {
      return [];
    }

    const quantity = Number(item.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      return [];
    }

    const source = nutrients.get(item.source_food_id);
    const grams = item.portion_id ? finite(item.grams) : null;
    const unitKcal = source ? scale(source.kcal, item.portion_id ? grams : null) : null;
    const roundedKcal = unitKcal === null ? null : Math.round(unitKcal);
    const unitFat = source ? scale(source.fat, item.portion_id ? grams : null) : null;
    const unitProtein = source ? scale(source.protein, item.portion_id ? grams : null) : null;
    const unitCarbs = source ? scale(source.carbs, item.portion_id ? grams : null) : null;
    const scaledKcal = lineTotal(roundedKcal, quantity);

    const line: MealLine = {
      id: item.id,
      name: item.name,
      href: item.portion_id ? `/portions/${item.portion_id}` : `/ingredients/${item.food_id}`,
      quantity,
      baseLabel: item.portion_id && grams !== null ? gramsLabel(grams) : "100 g",
      kcal: scaledKcal === null ? null : Math.round(scaledKcal),
      fat: lineTotal(unitFat, quantity),
      protein: lineTotal(unitProtein, quantity),
      carbs: lineTotal(unitCarbs, quantity),
      foodUseClass: item.food_use_class,
    };

    return [line];
  });
}

const ITEM_SELECT = `
  SELECT
    i.id,
    i.quantity,
    i.food_id,
    i.portion_id,
    COALESCE(p.name, NULLIF(btrim(f.name_en), '')) AS name,
    p.grams::text AS grams,
    COALESCE(p.food_id, i.food_id) AS source_food_id,
    c.name AS food_use_class,
    i.meal_id
  FROM meal_item i
  JOIN meal m ON m.id = i.meal_id
  LEFT JOIN fineli_food f ON f.id = i.food_id
  LEFT JOIN portion p ON p.id = i.portion_id
  LEFT JOIN fineli_food pf ON pf.id = p.food_id
  LEFT JOIN fineli_food_use_class c
    ON c.code = COALESCE(pf.food_use_class, f.food_use_class)
`;

function totals(lines: MealLine[]) {
  return {
    kcal: sum(lines.map((line) => line.kcal)),
    fat: sum(lines.map((line) => line.fat)),
    protein: sum(lines.map((line) => line.protein)),
    carbs: sum(lines.map((line) => line.carbs)),
  };
}

export async function listMeals(userId: string) {
  const meals = await query<{ id: string; name: string }>(
    `SELECT id, name
     FROM meal
     WHERE user_id = $1
     ORDER BY created_at DESC, name ASC`,
    [userId],
  );
  const items = await query<RawItem & { meal_id: string }>(
    `${ITEM_SELECT}
     WHERE m.user_id = $1
     ORDER BY i.created_at ASC`,
    [userId],
  );
  const byMeal = new Map<string, RawItem[]>();
  for (const item of items.rows) {
    const list = byMeal.get(item.meal_id) ?? [];
    list.push(item);
    byMeal.set(item.meal_id, list);
  }

  const summaries: MealSummary[] = [];
  for (const meal of meals.rows) {
    const lines = await linesFor(byMeal.get(meal.id) ?? []);
    summaries.push({
      id: meal.id,
      name: meal.name,
      items: lines.length,
      kcal: totals(lines).kcal,
    });
  }

  return summaries;
}

export async function getMeal(userId: string, id: string): Promise<MealDetail | null> {
  const meal = await query<{ id: string; name: string }>(
    "SELECT id, name FROM meal WHERE id = $1 AND user_id = $2",
    [id, userId],
  );
  const row = meal.rows[0];
  if (!row) {
    return null;
  }

  const items = await query<RawItem>(
    `${ITEM_SELECT}
     WHERE i.meal_id = $1 AND m.user_id = $2
     ORDER BY i.created_at ASC`,
    [id, userId],
  );
  const lines = await linesFor(items.rows);

  return {
    id: row.id,
    name: row.name,
    lines,
    ...totals(lines),
  };
}

export async function createMeal(userId: string, name: string) {
  const id = randomUUID();
  await query(
    "INSERT INTO meal (id, user_id, name) VALUES ($1, $2, $3)",
    [id, userId, name],
  );

  return id;
}

export async function renameMeal(userId: string, id: string, name: string) {
  await query("UPDATE meal SET name = $1 WHERE id = $2 AND user_id = $3", [name, id, userId]);
}

export async function removeMeal(userId: string, id: string) {
  await query("DELETE FROM meal WHERE id = $1 AND user_id = $2", [id, userId]);
}

export async function addMealItem(userId: string, mealIdValue: string, item: ItemRef) {
  return withTransaction(async (sql) => {
    const meal = await sql(
      "SELECT 1 AS found FROM meal WHERE id = $1 AND user_id = $2",
      [mealIdValue, userId],
    );
    if (!meal.rows[0]) {
      return false;
    }

    if (item.kind === "food") {
      const saved = await sql(
        "SELECT 1 AS found FROM saved_ingredient WHERE user_id = $1 AND food_id = $2",
        [userId, item.id],
      );
      if (!saved.rows[0]) {
        return false;
      }

      const updated = await sql(
        `UPDATE meal_item
         SET quantity = LEAST(quantity + 1, 99)
         WHERE meal_id = $1 AND food_id = $2
         RETURNING id`,
        [mealIdValue, item.id],
      );
      if (updated.rows[0]) {
        return true;
      }

      await sql(
        `INSERT INTO meal_item (id, meal_id, food_id, quantity)
         VALUES ($1, $2, $3, 1)`,
        [randomUUID(), mealIdValue, item.id],
      );
      return true;
    }

    const portion = await sql(
      "SELECT 1 AS found FROM portion WHERE id = $1 AND user_id = $2",
      [item.id, userId],
    );
    if (!portion.rows[0]) {
      return false;
    }

    const updated = await sql(
      `UPDATE meal_item
       SET quantity = LEAST(quantity + 1, 99)
       WHERE meal_id = $1 AND portion_id = $2
       RETURNING id`,
      [mealIdValue, item.id],
    );
    if (updated.rows[0]) {
      return true;
    }

    await sql(
      `INSERT INTO meal_item (id, meal_id, portion_id, quantity)
       VALUES ($1, $2, $3, 1)`,
      [randomUUID(), mealIdValue, item.id],
    );
    return true;
  });
}

export async function removeMealItem(userId: string, mealIdValue: string, itemId: string) {
  await query(
    `DELETE FROM meal_item
     WHERE id = $1
       AND meal_id = $2
       AND EXISTS (SELECT 1 FROM meal WHERE meal.id = meal_item.meal_id AND meal.user_id = $3)`,
    [itemId, mealIdValue, userId],
  );
}

export async function changeMealQuantity(
  userId: string,
  mealIdValue: string,
  itemId: string,
  direction: string,
  posted: string,
) {
  const current = await query<{ quantity: number }>(
    `SELECT quantity
     FROM meal_item
     WHERE id = $1
       AND meal_id = $2
       AND EXISTS (SELECT 1 FROM meal WHERE meal.id = meal_item.meal_id AND meal.user_id = $3)`,
    [itemId, mealIdValue, userId],
  );
  const quantity = Number(current.rows[0]?.quantity);
  if (!Number.isInteger(quantity)) {
    return;
  }

  let next = quantity;
  if (direction === "up") {
    next = Math.min(99, quantity + 1);
  } else if (direction === "down") {
    next = Math.max(1, quantity - 1);
  } else if (direction === "set") {
    const parsed = mealQuantity(posted);
    if (parsed === null) {
      return;
    }

    next = parsed;
  } else {
    return;
  }

  await query(
    `UPDATE meal_item
     SET quantity = $1
     WHERE id = $2 AND meal_id = $3`,
    [next, itemId, mealIdValue],
  );
}
