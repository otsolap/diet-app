import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import foodStyles from "@/app/foods/foods.module.css";
import { Button } from "@/src/components/button/button";
import { TextField } from "@/src/components/form/text-field";
import { DynamicPage, PageMain, PageTitle } from "@/src/components/page/page-frame";
import { requireUser } from "@/src/lib/auth";
import { formatKcal } from "@/src/lib/format";
import { listMeals, type MealSummary } from "@/src/lib/meals";
import styles from "./meals.module.css";

export const metadata: Metadata = {
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

function mealMeta(meal: MealSummary) {
  if (meal.kcal === null) {
    return itemLabel(meal.items);
  }

  return `${itemLabel(meal.items)} · ${formatKcal(meal.kcal)}`;
}

async function MealList() {
  await connection();
  const user = await requireUser();
  const meals = await listMeals(user.id);

  return (
    <PageMain>
      <PageTitle>Meals</PageTitle>
      <form className={foodStyles.form} method="post" action="/api/meals">
        <input type="hidden" name="intent" value="create" />
        <TextField
          className={foodStyles.field}
          label="Name"
          name="name"
          type="text"
          maxLength={80}
          required
          placeholder="Egg omelette"
        />
        <Button className={foodStyles.submit}>Add meal</Button>
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
    </PageMain>
  );
}

export default function MealsPage() {
  return (
    <DynamicPage title="Meals">
      <MealList />
    </DynamicPage>
  );
}
