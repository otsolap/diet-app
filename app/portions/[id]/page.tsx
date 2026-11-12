import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import styles from "@/app/foods/foods.module.css";
import { FoodCategoryIcon } from "@/src/components/food-list/food-category-icon";
import { requireUser } from "@/src/lib/auth";
import { getPortion, portionId } from "@/src/lib/portions";

export const metadata = {
  title: "Portion",
};

function energyLabel(kcal: number) {
  return `${new Intl.NumberFormat("en").format(kcal)} kcal`;
}

function PortionMissing() {
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Portion not found</h1>
      <p>That portion is not available.</p>
    </main>
  );
}

async function PortionView({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const user = await requireUser();
  const { id } = await params;
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

export default function PortionPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense
      fallback={
        <main className={styles.page}>
          <h1 className={styles.title}>Portion</h1>
          <p>Loading.</p>
        </main>
      }
    >
      <PortionView params={params} />
    </Suspense>
  );
}
