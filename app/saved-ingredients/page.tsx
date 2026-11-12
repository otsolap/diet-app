import type { Metadata } from "next";
import { connection } from "next/server";
import styles from "@/app/foods/foods.module.css";
import { DynamicPage, PageMain, PageTitle } from "@/src/components/page/page-frame";
import { SavedFoodList } from "@/src/components/food-list/saved-food-list";
import { requireUser } from "@/src/lib/auth";
import { listSavedIngredients } from "@/src/lib/ingredients";
import { listPortions, portionEntry } from "@/src/lib/portions";
import { firstQueryValue } from "@/src/lib/query";

export const metadata: Metadata = {
  title: "Ingredients",
};

async function SavedIngredients({
  searchParams,
}: Pick<PageProps<"/saved-ingredients">, "searchParams">) {
  await connection();
  const user = await requireUser();
  const params = await searchParams;
  const [saved, portions] = await Promise.all([
    listSavedIngredients(user.id),
    listPortions(user.id),
  ]);
  const foods = [...saved, ...portions.map(portionEntry)];

  return (
    <PageMain>
      <PageTitle>Ingredients</PageTitle>
      {firstQueryValue(params.error) === "used" ? (
        <p className={styles.error}>That portion is in a meal. Remove it from the meal first.</p>
      ) : null}
      {foods.length > 0 ? (
        <div className={styles.controls}>
          <SavedFoodList foods={foods} />
        </div>
      ) : (
        <p>You have no ingredients.</p>
      )}
    </PageMain>
  );
}

export default function SavedIngredientsPage({
  searchParams,
}: PageProps<"/saved-ingredients">) {
  return (
    <DynamicPage title="Ingredients">
      <SavedIngredients searchParams={searchParams} />
    </DynamicPage>
  );
}
