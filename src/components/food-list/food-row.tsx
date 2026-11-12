import Link from "next/link";
import type { FoodListEntry } from "@/src/lib/food-list";
import styles from "./food-list.module.css";

export type { FoodListEntry };

export function FoodRow({ food, detail }: { food: FoodListEntry; detail: string }) {
  return (
    <Link className={styles.item} href={food.href ?? `/ingredients/${food.id}`}>
      <span className={styles.nameText}>{food.name}</span>
      <span className={styles.meta}>{detail}</span>
    </Link>
  );
}
