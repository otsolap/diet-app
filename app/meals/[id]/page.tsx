import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import foodStyles from "@/app/foods/foods.module.css";
import { Button } from "@/src/components/button/button";
import { TextField } from "@/src/components/form/text-field";
import { BackLink } from "@/src/components/page/back-link";
import { DynamicPage, PageMain, PageTitle } from "@/src/components/page/page-frame";
import { MissingNote } from "@/src/components/page/missing-note";
import { requireUser } from "@/src/lib/auth";
import { formatKcal } from "@/src/lib/format";
import { getMeal, listMealChoices, mealId } from "@/src/lib/meals";
import { AddIngredient } from "./add-ingredient";
import { QuantityForms } from "./quantity-forms";
import styles from "../meals.module.css";

export const metadata: Metadata = {
  title: "Meal",
};

function MealMissing() {
  return <MissingNote title="Meal not found" message="That meal is not available." />;
}

async function MealView({ params }: Pick<PageProps<"/meals/[id]">, "params">) {
  await connection();
  const user = await requireUser();
  const { id } = await params;
  const parsed = mealId(id);
  if (!parsed) {
    return <MealMissing />;
  }

  const [meal, choices] = await Promise.all([
    getMeal(user.id, parsed),
    listMealChoices(user.id),
  ]);
  if (!meal) {
    return <MealMissing />;
  }

  return (
    <PageMain>
      <BackLink href="/meals" label="Meals" />
      <PageTitle className={styles.mealTitle}>{meal.name}</PageTitle>
      {meal.lines.length > 0 ? (
        <ul className={styles.lines}>
          {meal.lines.map((line) => (
            <li className={styles.line} key={line.id}>
              <div className={styles.identity}>
                <Link className={styles.name} href={line.href}>
                  {line.name}
                </Link>
                <p className={styles.unit}>{formatKcal(line.kcal)}</p>
                <form method="post" action="/api/meals">
                  <input type="hidden" name="intent" value="remove-item" />
                  <input type="hidden" name="mealId" value={meal.id} />
                  <input type="hidden" name="itemId" value={line.id} />
                  <button className={styles.lineRemove} type="submit">
                    Remove
                  </button>
                </form>
              </div>
              <QuantityForms mealIdValue={meal.id} line={line} />
            </li>
          ))}
        </ul>
      ) : (
        <p>This meal has no ingredients.</p>
      )}
      {meal.lines.length > 0 ? (
        <div className={styles.totalCard}>
          <p className={styles.totalLabel}>Total</p>
          <p className={styles.totalEnergy}>{formatKcal(meal.kcal)}</p>
        </div>
      ) : null}
      <AddIngredient mealIdValue={meal.id} choices={choices} />
      <form className={`${foodStyles.form} ${styles.renameForm}`} method="post" action="/api/meals">
        <input type="hidden" name="intent" value="rename" />
        <input type="hidden" name="mealId" value={meal.id} />
        <TextField
          className={foodStyles.field}
          label="Name"
          name="name"
          type="text"
          maxLength={80}
          required
          defaultValue={meal.name}
        />
        <Button className={foodStyles.submit}>Rename</Button>
      </form>
      <form method="post" action="/api/meals">
        <input type="hidden" name="intent" value="delete" />
        <input type="hidden" name="mealId" value={meal.id} />
        <button className={foodStyles.remove} type="submit">
          Delete meal
        </button>
      </form>
    </PageMain>
  );
}

export default function MealPage({ params }: PageProps<"/meals/[id]">) {
  return (
    <DynamicPage title="Meal">
      <MealView params={params} />
    </DynamicPage>
  );
}
