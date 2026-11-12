import { Suspense } from "react";
import { connection } from "next/server";
import styles from "@/app/foods/foods.module.css";
import { SavedFoodList } from "@/src/components/food-list/saved-food-list";
import { requireUser } from "@/src/lib/auth";
import { listSavedIngredients } from "@/src/lib/ingredients";
import { listPortions, portionEntry } from "@/src/lib/portions";

export const metadata = {
  title: "Ingredients",
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function SavedIngredients({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const user = await requireUser();
  const params = await searchParams;
  const [saved, portions] = await Promise.all([
    listSavedIngredients(user.id),
    listPortions(user.id),
  ]);
  const foods = [...saved, ...portions.map(portionEntry)];

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Ingredients</h1>
      {firstValue(params.error) === "used" ? (
        <p className={styles.error}>That portion is in a meal. Remove it from the meal first.</p>
      ) : null}
      {foods.length > 0 ? (
        <SavedFoodList foods={foods} />
      ) : (
        <p>You have no ingredients.</p>
      )}
    </main>
  );
}

export default function SavedIngredientsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense
      fallback={
        <main className={styles.page}>
          <h1 className={styles.title}>Ingredients</h1>
          <p>Loading.</p>
        </main>
      }
    >
      <SavedIngredients searchParams={searchParams} />
    </Suspense>
  );
}
