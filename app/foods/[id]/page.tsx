import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { foodId, getFood, type FoodDetail } from "@/src/lib/food-search";
import styles from "../foods.module.css";

export const metadata = {
  title: "Food",
};

function energyLabel(kcal: number) {
  return `${new Intl.NumberFormat("en").format(kcal)} kcal per 100 g`;
}

function FoodMissing() {
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Food not found</h1>
      <p>That food is not available.</p>
      <Link className={styles.back} href="/foods">
        Foods
      </Link>
    </main>
  );
}

function FoodView({ food }: { food: FoodDetail }) {
  return (
    <main className={styles.page}>
      <Link className={styles.back} href="/foods">
        Foods
      </Link>
      <h1 className={styles.title}>{food.name}</h1>
      {food.otherNames.length > 0 ? (
        <p className={styles.otherNames}>
          {food.otherNames.map((name) => (
            <span key={name}>{name}</span>
          ))}
        </p>
      ) : null}
      <p className={styles.kcal}>
        {food.kcal === null ? "No energy value" : energyLabel(food.kcal)}
      </p>
      {food.nutrients.length > 0 ? (
        <dl className={styles.nutrients}>
          {food.nutrients.map((item) => (
            <div className={styles.nutrient} key={item.label}>
              <dt>{item.label}</dt>
              <dd className={styles.amount}>{item.amount}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </main>
  );
}

async function FoodDetail({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const parsed = foodId(id);
  if (parsed === null) {
    return <FoodMissing />;
  }

  const result = await getFood(parsed);
  if ("missing" in result) {
    return <FoodMissing />;
  }

  if ("error" in result) {
    return (
      <main className={styles.page}>
        <Link className={styles.back} href="/foods">
          Foods
        </Link>
        <h1 className={styles.title}>Food</h1>
        <p className={styles.error}>{result.error}</p>
      </main>
    );
  }

  return <FoodView food={result.food} />;
}

export default function FoodPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense
      fallback={
        <main className={styles.page}>
          <h1 className={styles.title}>Food</h1>
          <p>Loading.</p>
        </main>
      }
    >
      <FoodDetail params={params} />
    </Suspense>
  );
}
