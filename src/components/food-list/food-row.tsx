import Link from "next/link";
import styles from "./food-list.module.css";

export type FoodListEntry = {
  id: number;
  name: string;
  kcal: number | null;
  foodUseClass: string | null;
  foodUseParent: string | null;
  listKey?: string;
  href?: string;
  gramsLabel?: string;
  idLabel?: string;
  kind?: "food" | "portion";
  portionId?: string;
};

export function energyText(kcal: number | null) {
  if (kcal === null) {
    return "No energy value";
  }

  return `${new Intl.NumberFormat("en").format(kcal)} kcal`;
}

export function FoodRow({ food, detail }: { food: FoodListEntry; detail: string }) {
  return (
    <Link className={styles.item} href={food.href ?? `/ingredients/${food.id}`}>
      <span className={styles.nameText}>{food.name}</span>
      <span className={styles.meta}>{detail}</span>
    </Link>
  );
}
