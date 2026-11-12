import { formatKcal } from "@/src/lib/format";
import type { FoodListEntry } from "@/src/lib/food-list";
import { FoodGroups } from "./food-groups";
import { FoodRow } from "./food-row";
import styles from "./food-list.module.css";

export type { FoodListEntry };

function searchDetail(food: FoodListEntry) {
  const energy = formatKcal(food.kcal);
  if (food.kind === "portion" && food.gramsLabel) {
    return `${food.gramsLabel} · ${energy}`;
  }

  if (food.foodUseClass) {
    return `${food.foodUseClass} · ${energy}`;
  }

  return energy;
}

export function FoodList({
  foods,
  savedIds,
  returnTo,
}: {
  foods: FoodListEntry[];
  savedIds?: ReadonlySet<number>;
  returnTo?: string;
}) {
  return (
    <FoodGroups foods={foods}>
      {(food) => {
        const saved = food.kind !== "portion" && (savedIds?.has(food.id) ?? false);

        return (
          <li className={styles.entry} key={food.listKey ?? `food:${food.id}`}>
            <FoodRow food={food} detail={searchDetail(food)} />
            {food.kind === "portion" ? null : saved ? (
              <span className={styles.savedMark}>Saved</span>
            ) : (
              <form method="post" action="/api/ingredients">
                <input type="hidden" name="foodId" value={food.id} />
                {returnTo ? <input type="hidden" name="next" value={returnTo} /> : null}
                <button className={styles.save} type="submit">
                  Save
                </button>
              </form>
            )}
          </li>
        );
      }}
    </FoodGroups>
  );
}
