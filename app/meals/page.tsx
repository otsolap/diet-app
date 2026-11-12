import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import foodStyles from "@/app/foods/foods.module.css";
import { primaryButtonClass } from "@/src/components/button/button";
import { requireUser } from "@/src/lib/auth";
import { listMeals, type MealSummary } from "@/src/lib/meals";
import styles from "./meals.module.css";

export const metadata = {
  title: "Meals",
};

function countLabel(total: number) {
  if (total === 1) {
    return "1 meal";
  }

  return `${total} meals`;
}

function itemLabel(total: number) {
  if (total === 1) {
    return "1 ingredient";
  }

  return `${total} ingredients`;
}

function energyLabel(kcal: number) {
  return `${new Intl.NumberFormat("en").format(kcal)} kcal`;
}

function mealMeta(meal: MealSummary) {
  if (meal.kcal === null) {
    return itemLabel(meal.items);
  }

  return `${itemLabel(meal.items)} · ${energyLabel(meal.kcal)}`;
}

async function MealList() {
  await connection();
  const user = await requireUser();
  const meals = await listMeals(user.id);

  return (
    <main className={foodStyles.page}>
      <h1 className={foodStyles.title}>Meals</h1>
      <form className={foodStyles.form} method="post" action="/api/meals">
        <input type="hidden" name="intent" value="create" />
        <label className={foodStyles.field}>
          Name
          <input name="name" type="text" maxLength={80} required placeholder="Egg omelette" />
        </label>
        <button className={`${primaryButtonClass} ${foodStyles.submit}`} type="submit">
          Add meal
        </button>
      </form>
      {meals.length > 0 ? (
        <>
          <p className={foodStyles.count}>{countLabel(meals.length)}</p>
          <ul className={styles.list}>
            {meals.map((meal) => (
              <li className={styles.meal} key={meal.id}>
                <Link className={styles.mealName} href={`/meals/${meal.id}`}>
                  {meal.name}
                </Link>
                <p className={styles.meta}>{mealMeta(meal)}</p>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p>You have no meals.</p>
      )}
    </main>
  );
}

export default function MealsPage() {
  return (
    <Suspense
      fallback={
        <main className={foodStyles.page}>
          <h1 className={foodStyles.title}>Meals</h1>
          <p>Loading.</p>
        </main>
      }
    >
      <MealList />
    </Suspense>
  );
}
