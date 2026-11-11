import Link from "next/link";
import styles from "./food-list.module.css";

export type FoodListEntry = {
  id: number;
  name: string;
  kcal: number | null;
};

function energyLabel(kcal: number) {
  return `${new Intl.NumberFormat("en").format(kcal)} kcal`;
}

export function FoodList({
  foods,
  showId = false,
}: {
  foods: FoodListEntry[];
  showId?: boolean;
}) {
  return (
    <ul className={styles.list}>
      {foods.map((food) => (
        <li key={food.id}>
          <Link className={styles.item} href={`/foods/${food.id}`}>
            {showId ? <span className={styles.id}>Id {food.id}</span> : null}
            <span className={styles.name}>{food.name}</span>
            <span className={styles.energy}>
              {food.kcal === null ? "No energy value" : energyLabel(food.kcal)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
