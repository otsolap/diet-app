import type { ReactNode } from "react";
import type { FoodListEntry } from "./food-row";
import styles from "./food-list.module.css";

function groupFoods(foods: FoodListEntry[]) {
  const groups: { parent: string; foods: FoodListEntry[] }[] = [];
  const index = new Map<string, number>();

  for (const food of foods) {
    const parent = food.foodUseParent ?? "Other";
    const existing = index.get(parent);
    if (existing === undefined) {
      index.set(parent, groups.length);
      groups.push({ parent, foods: [food] });
    } else {
      groups[existing]?.foods.push(food);
    }
  }

  return groups;
}

export function FoodGroups({
  foods,
  children,
}: {
  foods: FoodListEntry[];
  children: (food: FoodListEntry) => ReactNode;
}) {
  return (
    <div className={styles.groups}>
      {groupFoods(foods).map((group) => (
        <section key={group.parent} className={styles.group}>
          <h2 className={styles.groupTitle}>{group.parent}</h2>
          <ul className={styles.list}>{group.foods.map((food) => children(food))}</ul>
        </section>
      ))}
    </div>
  );
}
