import { RemoveButton } from "@/src/components/form/remove-button";
import { formatKcal } from "@/src/lib/format";
import type { FoodListEntry } from "@/src/lib/food-list";
import { FoodRow } from "./food-row";
import styles from "./food-list.module.css";

function savedDetail(food: FoodListEntry) {
  const energy = formatKcal(food.kcal);
  if (food.kind === "portion" && food.gramsLabel) {
    return `${energy} / ${food.gramsLabel}`;
  }

  return `${energy} / 100 g`;
}

export function SavedFoodList({ foods }: { foods: FoodListEntry[] }) {
  return (
    <ul className={styles.list}>
      {foods.map((food) => (
        <li className={styles.entry} key={food.listKey ?? `food:${food.id}`}>
          <FoodRow food={food} detail={savedDetail(food)} />
          {food.kind === "portion" && food.portionId ? (
            <RemoveButton
              action="/api/portions"
              idName="portionId"
              idValue={food.portionId}
              className={styles.remove}
            />
          ) : (
            <RemoveButton
              action="/api/ingredients"
              idName="foodId"
              idValue={food.id}
              className={styles.remove}
            />
          )}
        </li>
      ))}
    </ul>
  );
}
