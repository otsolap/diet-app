import { FoodGroups } from "./food-groups";
import { FoodRow, type FoodListEntry } from "./food-row";

export type { FoodListEntry };

export function FoodList({
  foods,
  savedIds,
}: {
  foods: FoodListEntry[];
  savedIds?: ReadonlySet<number>;
}) {
  return (
    <FoodGroups foods={foods}>
      {(food) => (
        <li key={food.id}>
          <FoodRow food={food} saved={savedIds?.has(food.id) ?? false} />
        </li>
      )}
    </FoodGroups>
  );
}
