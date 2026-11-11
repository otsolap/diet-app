import { FoodGroups } from "./food-groups";
import { FoodRow, type FoodListEntry } from "./food-row";
import styles from "./food-list.module.css";

export function SavedFoodList({ foods }: { foods: FoodListEntry[] }) {
  return (
    <FoodGroups foods={foods}>
      {(food) => (
        <li key={food.id} className={styles.entry}>
          <FoodRow food={food} showId />
          <form className={styles.removeForm} method="post" action="/api/ingredients">
            <input type="hidden" name="foodId" value={food.id} />
            <input type="hidden" name="intent" value="remove" />
            <button className={styles.remove} type="submit" aria-label={`Unsave ${food.name}`}>
              Unsave
            </button>
          </form>
        </li>
      )}
    </FoodGroups>
  );
}
