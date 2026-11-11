import Link from "next/link";
import styles from "./food-list.module.css";

export type FoodListEntry = {
  id: number;
  name: string;
  kcal: number | null;
  foodUseClass: string | null;
  foodUseParent: string | null;
};

function energyLabel(kcal: number) {
  return `${new Intl.NumberFormat("en").format(kcal)} kcal`;
}

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

export function FoodList({
  foods,
  showId = false,
}: {
  foods: FoodListEntry[];
  showId?: boolean;
}) {
  return (
    <div className={styles.groups}>
      {groupFoods(foods).map((group) => (
        <section key={group.parent} className={styles.group}>
          <h2 className={styles.groupTitle}>{group.parent}</h2>
          <ul className={styles.list}>
            {group.foods.map((food) => (
              <li key={food.id}>
                <Link
                  className={`${styles.item} ${showId ? styles.itemWithId : ""}`}
                  href={`/foods/${food.id}`}
                >
                  {showId ? <span className={styles.id}>{food.id}</span> : null}
                  <span className={styles.name}>{food.name}</span>
                  <span className={styles.use}>{food.foodUseClass}</span>
                  <span className={styles.energy}>
                    {food.kcal === null ? "No energy value" : energyLabel(food.kcal)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
