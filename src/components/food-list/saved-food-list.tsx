import { energyText, FoodRow, type FoodListEntry } from "./food-row";
import styles from "./food-list.module.css";

function savedDetail(food: FoodListEntry) {
  const energy = energyText(food.kcal);
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
            <form method="post" action="/api/portions">
              <input type="hidden" name="portionId" value={food.portionId} />
              <input type="hidden" name="intent" value="remove" />
              <button className={styles.remove} type="submit">
                Remove
              </button>
            </form>
          ) : (
            <form method="post" action="/api/ingredients">
              <input type="hidden" name="foodId" value={food.id} />
              <input type="hidden" name="intent" value="remove" />
              <button className={styles.remove} type="submit">
                Remove
              </button>
            </form>
          )}
        </li>
      ))}
    </ul>
  );
}
