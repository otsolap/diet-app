import Link from "next/link";
import { FoodCategoryIcon } from "./food-category-icon";
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

export function FoodRow({
  food,
  showId = false,
  saved = false,
}: {
  food: FoodListEntry;
  showId?: boolean;
  saved?: boolean;
}) {
  return (
    <Link
      className={`${styles.item} ${showId ? styles.itemWithId : ""}`}
      href={`/foods/${food.id}`}
    >
      {showId ? <span className={styles.id}>{food.id}</span> : null}
      <FoodCategoryIcon category={food.foodUseClass} saved={saved} className={styles.icon} />
      <span className={styles.name}>{food.name}</span>
      <span className={styles.use}>{food.foodUseClass}</span>
      <span className={styles.energy}>
        {food.kcal === null ? "No energy value" : energyLabel(food.kcal)}
      </span>
    </Link>
  );
}
