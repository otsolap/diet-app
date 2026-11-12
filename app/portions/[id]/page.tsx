import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import styles from "@/app/foods/foods.module.css";
import { primaryButtonClass } from "@/src/components/button/button";
import { FoodCategoryIcon } from "@/src/components/food-list/food-category-icon";
import { requireUser } from "@/src/lib/auth";
import { getPortion, portionId } from "@/src/lib/portions";

export const metadata = {
  title: "Portion",
};

function energyLabel(kcal: number) {
  return `${new Intl.NumberFormat("en").format(kcal)} kcal`;
}

function gramsInput(grams: number) {
  return new Intl.NumberFormat("en", { maximumFractionDigits: 2, useGrouping: false }).format(grams);
}

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function PortionMissing() {
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Portion not found</h1>
      <p>That portion is not available.</p>
    </main>
  );
}

async function PortionView({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const user = await requireUser();
  const { id } = await params;
  const query = await searchParams;
  const parsed = portionId(id);
  if (!parsed) {
    return <PortionMissing />;
  }

  const portion = await getPortion(user.id, parsed);
  if (!portion) {
    return <PortionMissing />;
  }

  return (
    <main className={styles.page}>
      <div className={styles.titleRow}>
        <FoodCategoryIcon category={portion.foodUseClass} className={styles.categoryIcon} />
        <h1 className={styles.title}>{portion.name}</h1>
      </div>
      <p className={styles.foodId}>{portion.gramsLabel}</p>
      <p className={styles.source}>
        From <Link href={`/ingredients/${portion.foodId}`}>{portion.foodName}</Link>
      </p>
      <form className={styles.form} method="post" action="/api/portions">
        <input type="hidden" name="intent" value="update" />
        <input type="hidden" name="portionId" value={portion.id} />
        <label className={styles.field}>
          Name
          <input name="name" type="text" maxLength={80} required defaultValue={portion.name} />
        </label>
        <label className={styles.field}>
          Grams
          <input
            name="grams"
            type="number"
            required
            min={0.1}
            max={9999}
            step={0.1}
            defaultValue={gramsInput(portion.grams)}
          />
        </label>
        <button className={`${primaryButtonClass} ${styles.submit}`} type="submit">
          Update
        </button>
      </form>
      {firstValue(query.error) === "values" ? (
        <p className={styles.error}>Enter a name and a weight in grams.</p>
      ) : null}
      <p className={styles.kcal}>
        {portion.kcal === null ? "No energy value" : energyLabel(portion.kcal)}
      </p>
      <form method="post" action="/api/portions">
        <input type="hidden" name="portionId" value={portion.id} />
        <input type="hidden" name="intent" value="remove" />
        <button className={styles.remove} type="submit">
          Remove portion
        </button>
      </form>
      {portion.nutrients.length > 0 ? (
        <table className={styles.nutrients}>
          <thead>
            <tr>
              <th className={styles.heading} scope="col">
                Macro
              </th>
              <th className={styles.headingValue} scope="col">
                Grams
              </th>
              <th className={styles.headingValue} scope="col">
                Percent
              </th>
            </tr>
          </thead>
          <tbody>
            {portion.nutrients.map((item) => (
              <tr key={item.label}>
                <th className={styles.macro} scope="row">
                  {item.label}
                </th>
                <td className={styles.amount}>{item.amount}</td>
                <td className={styles.share}>{item.share}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </main>
  );
}

export default function PortionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense
      fallback={
        <main className={styles.page}>
          <h1 className={styles.title}>Portion</h1>
          <p>Loading.</p>
        </main>
      }
    >
      <PortionView params={params} searchParams={searchParams} />
    </Suspense>
  );
}
