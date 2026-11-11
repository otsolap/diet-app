import { Suspense } from "react";
import { connection } from "next/server";
import styles from "@/app/foods/foods.module.css";
import { FoodList } from "@/src/components/food-list/food-list";
import { requireUser } from "@/src/lib/auth";
import { listSavedIngredients } from "@/src/lib/ingredients";

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
  const foods = await listSavedIngredients(user.id);

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Saved ingredients</h1>
      {foods.length > 0 ? (
        <>
          <p className={styles.count}>{countLabel(foods.length)}</p>
          <FoodList foods={foods} showId />
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
