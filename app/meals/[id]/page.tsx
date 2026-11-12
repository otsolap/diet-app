import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import foodStyles from "@/app/foods/foods.module.css";
import { primaryButtonClass } from "@/src/components/button/button";
import { FoodCategoryIcon } from "@/src/components/food-list/food-category-icon";
import { requireUser } from "@/src/lib/auth";
import { getMeal, listMealChoices, mealId, type MealChoice, type MealLine } from "@/src/lib/meals";
import styles from "../meals.module.css";

export const metadata = {
  title: "Meal",
};

function energyLabel(kcal: number | null) {
  if (kcal === null) {
    return "No energy value";
  }

  return `${new Intl.NumberFormat("en").format(kcal)} kcal`;
}

function lineEnergy(kcal: number | null) {
  if (kcal === null) {
    return "No energy";
  }

  return `${new Intl.NumberFormat("en").format(kcal)} kcal`;
}

function gramLabel(value: number | null) {
  if (value === null) {
    return "—";
  }

  const text = new Intl.NumberFormat("en", { maximumFractionDigits: 1 }).format(value);
  return `${text} g`;
}

function choiceGroups(choices: MealChoice[]) {
  const saved = choices.filter((choice) => choice.group === "Ingredients");
  const portions = choices.filter((choice) => choice.group === "Portions");

  return [
    { label: "Ingredients", items: saved },
    { label: "Portions", items: portions },
  ].filter((group) => group.items.length > 0);
}

function MealMissing() {
  return (
    <main className={foodStyles.page}>
      <h1 className={foodStyles.title}>Meal not found</h1>
      <p>That meal is not available.</p>
    </main>
  );
}

function QuantityForms({ mealIdValue, line }: { mealIdValue: string; line: MealLine }) {
  return (
    <div className={styles.controls}>
      <form className={styles.step} method="post" action="/api/meals">
        <input type="hidden" name="intent" value="quantity" />
        <input type="hidden" name="mealId" value={mealIdValue} />
        <input type="hidden" name="itemId" value={line.id} />
        <input type="hidden" name="direction" value="down" />
        <button
          className={styles.stepButton}
          type="submit"
          disabled={line.quantity <= 1}
          aria-label={`Decrease ${line.name}`}
        >
          −
        </button>
      </form>
      <form className={styles.set} method="post" action="/api/meals">
        <input type="hidden" name="intent" value="quantity" />
        <input type="hidden" name="mealId" value={mealIdValue} />
        <input type="hidden" name="itemId" value={line.id} />
        <input type="hidden" name="direction" value="set" />
        <input
          className={styles.quantity}
          name="quantity"
          type="number"
          inputMode="numeric"
          min={1}
          max={99}
          defaultValue={line.quantity}
          aria-label={`Count for ${line.name}`}
          required
        />
        <button className={styles.setButton} type="submit">
          Set
        </button>
      </form>
      <form className={styles.step} method="post" action="/api/meals">
        <input type="hidden" name="intent" value="quantity" />
        <input type="hidden" name="mealId" value={mealIdValue} />
        <input type="hidden" name="itemId" value={line.id} />
        <input type="hidden" name="direction" value="up" />
        <button
          className={styles.stepButton}
          type="submit"
          disabled={line.quantity >= 99}
          aria-label={`Increase ${line.name}`}
        >
          +
        </button>
      </form>
      <form className={styles.removeForm} method="post" action="/api/meals">
        <input type="hidden" name="intent" value="remove-item" />
        <input type="hidden" name="mealId" value={mealIdValue} />
        <input type="hidden" name="itemId" value={line.id} />
        <button className={foodStyles.remove} type="submit">
          Remove
        </button>
      </form>
    </div>
  );
}

function AddIngredient({ mealIdValue, choices }: { mealIdValue: string; choices: MealChoice[] }) {
  const groups = choiceGroups(choices);
  if (groups.length === 0) {
    return <p className={foodStyles.hint}>Save an ingredient or add a portion first.</p>;
  }

  return (
    <form className={foodStyles.form} method="post" action="/api/meals">
      <input type="hidden" name="intent" value="add" />
      <input type="hidden" name="mealId" value={mealIdValue} />
      <label className={foodStyles.field}>
        Ingredient
        <select className={styles.select} name="item" required defaultValue="">
          <option value="">Choose an ingredient</option>
          {groups.map((group) => (
            <optgroup key={group.label} label={group.label}>
              {group.items.map((choice) => (
                <option key={choice.value} value={choice.value}>
                  {choice.name} ({choice.detail})
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>
      <button className={`${primaryButtonClass} ${foodStyles.submit}`} type="submit">
        Add
      </button>
    </form>
  );
}

async function MealView({ params }: { params: Promise<{ id: string }> }) {
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
    <main className={foodStyles.page}>
      <nav className={foodStyles.breadcrumb} aria-label="Breadcrumb">
        <ol className={foodStyles.crumbList}>
          <li className={foodStyles.crumbItem}>
            <Link className={foodStyles.crumbLink} href="/meals">
              Meals
            </Link>
          </li>
          <li className={foodStyles.crumbItem} aria-current="page">
            <span className={foodStyles.crumbCurrent}>{meal.name}</span>
          </li>
        </ol>
      </nav>
      <h1 className={foodStyles.title}>{meal.name}</h1>
      <form className={foodStyles.form} method="post" action="/api/meals">
        <input type="hidden" name="intent" value="rename" />
        <input type="hidden" name="mealId" value={meal.id} />
        <label className={foodStyles.field}>
          Name
          <input name="name" type="text" maxLength={80} required defaultValue={meal.name} />
        </label>
        <button className={`${primaryButtonClass} ${foodStyles.submit}`} type="submit">
          Rename
        </button>
      </form>
      <p className={foodStyles.hint}>Set the count to multiply one ingredient.</p>
      <AddIngredient mealIdValue={meal.id} choices={choices} />
      {meal.lines.length > 0 ? (
        <>
          <p className={foodStyles.kcal}>{energyLabel(meal.kcal)}</p>
          <div className={styles.totals}>
            <p className={styles.totalItem}>Fat {gramLabel(meal.fat)}</p>
            <p className={styles.totalItem}>Protein {gramLabel(meal.protein)}</p>
            <p className={styles.totalItem}>Carbs {gramLabel(meal.carbs)}</p>
          </div>
          <ul className={styles.lines}>
            {meal.lines.map((line) => (
              <li className={styles.line} key={line.id}>
                <div className={styles.head}>
                  <FoodCategoryIcon category={line.foodUseClass} className={styles.icon} />
                  <div className={styles.identity}>
                    <Link className={styles.name} href={line.href}>
                      {line.name}
                    </Link>
                    <p className={styles.unit}>
                      {line.quantity} × {line.baseLabel}
                    </p>
                  </div>
                  <span className={styles.energy}>{lineEnergy(line.kcal)}</span>
                </div>
                <QuantityForms mealIdValue={meal.id} line={line} />
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p>This meal has no ingredients.</p>
      )}
      <form method="post" action="/api/meals">
        <input type="hidden" name="intent" value="delete" />
        <input type="hidden" name="mealId" value={meal.id} />
        <button className={foodStyles.remove} type="submit">
          Delete meal
        </button>
      </form>
    </main>
  );
}

export default function MealPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense
      fallback={
        <main className={foodStyles.page}>
          <h1 className={foodStyles.title}>Meal</h1>
          <p>Loading.</p>
        </main>
      }
    >
      <MealView params={params} />
    </Suspense>
  );
}
