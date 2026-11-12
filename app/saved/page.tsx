import { Suspense } from "react";
import { connection } from "next/server";
import styles from "@/app/foods/foods.module.css";
import { SavedFoodList } from "@/src/components/food-list/saved-food-list";
import { requireUser } from "@/src/lib/auth";
import { listSavedIngredients } from "@/src/lib/ingredients";
import { listPortions, portionEntry } from "@/src/lib/portions";

export const metadata = {
  title: "Saved",
};

function countLabel(total: number) {
  if (total === 1) {
    return "1 ingredient";
  }

  return `${total} ingredients`;
}

async function SavedIngredients() {
  await connection();
  const user = await requireUser();
  const [saved, portions] = await Promise.all([
    listSavedIngredients(user.id),
    listPortions(user.id),
  ]);
  const foods = [...saved, ...portions.map(portionEntry)];

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Saved ingredients</h1>
      {foods.length > 0 ? (
        <>
          <p className={styles.count}>{countLabel(foods.length)}</p>
          <SavedFoodList foods={foods} />
        </>
      ) : (
        <p>You have no saved ingredients.</p>
      )}
    </main>
  );
}

export default function SavedPage() {
  return (
    <Suspense
      fallback={
        <main className={styles.page}>
          <h1 className={styles.title}>Saved ingredients</h1>
          <p>Loading.</p>
        </main>
      }
    >
      <SavedIngredients />
    </Suspense>
  );
}
