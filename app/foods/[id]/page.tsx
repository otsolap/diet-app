import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { foodId, getFood, type FoodDetail, type FoodNutrient } from "@/src/lib/food-search";
import styles from "../foods.module.css";

export const metadata = {
  title: "Food",
};

const CRUMB_NAME_LIMIT = 36;

const CHART_COLORS: Record<string, string> = {
  Fat: "var(--color-secondary)",
  Protein: "var(--color-tertiary-light)",
  Carbs: "var(--color-white)",
};

function energyLabel(kcal: number) {
  return `${new Intl.NumberFormat("en").format(kcal)} kcal per 100 g`;
}

function crumbLabel(name: string) {
  if (name.length <= CRUMB_NAME_LIMIT) {
    return name;
  }

  const comma = name.indexOf(",");
  if (comma <= 0) {
    return name;
  }

  const shortName = name.slice(0, comma).trim();
  return shortName || name;
}

function FoodCrumb({ current }: { current: string }) {
  const label = crumbLabel(current);

  return (
    <nav className={styles.breadcrumb} aria-label="Breadcrumb">
      <ol className={styles.crumbList}>
        <li className={styles.crumbItem}>
          <Link className={styles.crumbLink} href="/foods">
            Foods
          </Link>
        </li>
        <li className={styles.crumbItem} aria-current="page">
          <span className={styles.crumbCurrent} title={label === current ? undefined : current}>
            {label}
          </span>
        </li>
      </ol>
    </nav>
  );
}

function chartPercent(share: string | null) {
  if (share === null || !share.endsWith("%")) {
    return null;
  }

  const percent = Number(share.slice(0, -1));
  if (!Number.isFinite(percent)) {
    return null;
  }

  return percent;
}

function pieImage(parts: { label: string; percent: number }[]) {
  const total = parts.reduce((sum, part) => sum + part.percent, 0);
  if (total <= 0) {
    return null;
  }

  const scale = 100 / total;
  let cursor = 0;
  const stops = parts.flatMap((part) => {
    if (part.percent <= 0) {
      return [];
    }

    const start = cursor;
    cursor += part.percent * scale;
    const color = CHART_COLORS[part.label] ?? "var(--color-primary-light)";
    return [`${color} ${trimPercent(start)}% ${trimPercent(cursor)}%`];
  });

  return `conic-gradient(${stops.join(", ")})`;
}

function trimPercent(value: number) {
  return Math.round(value * 10) / 10;
}

function swatchClass(label: string) {
  if (label === "Fat") {
    return styles.swatchFat;
  }

  if (label === "Protein") {
    return styles.swatchProtein;
  }

  return styles.swatchCarbs;
}

function MacroChart({ nutrients }: { nutrients: FoodNutrient[] }) {
  const parts = nutrients.flatMap((item) => {
    const percent = chartPercent(item.share);
    if (percent === null) {
      return [];
    }

    return [{ label: item.label, percent, share: item.share ?? "" }];
  });
  const image = pieImage(parts);
  if (image === null) {
    return null;
  }

  return (
    <figure className={styles.chart}>
      <figcaption className={styles.chartTitle}>Macro shares</figcaption>
      <div className={styles.pie} style={{ backgroundImage: image }} aria-hidden="true" />
      <ul className={styles.legend}>
        {parts.map((part) => (
          <li key={part.label} className={styles.legendItem}>
            <span className={`${styles.swatch} ${swatchClass(part.label)}`} aria-hidden="true" />
            <span>{part.label}</span>
            <span>{part.share}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}

function FoodMissing() {
  return (
    <main className={styles.page}>
      <FoodCrumb current="Food not found" />
      <h1 className={styles.title}>Food not found</h1>
      <p>That food is not available.</p>
    </main>
  );
}

function FoodView({ food }: { food: FoodDetail }) {
  return (
    <main className={styles.page}>
      <FoodCrumb current={food.name} />
      <h1 className={styles.title}>{food.name}</h1>
      <p className={styles.foodId}>Id {food.id}</p>
      <p className={styles.kcal}>
        {food.kcal === null ? "No energy value" : energyLabel(food.kcal)}
      </p>
      {food.nutrients.length > 0 ? (
        <div className={styles.detail}>
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
              {food.nutrients.map((item) => (
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
          <MacroChart nutrients={food.nutrients} />
        </div>
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
        <FoodCrumb current="Food" />
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
          <FoodCrumb current="Food" />
          <h1 className={styles.title}>Food</h1>
          <p>Loading.</p>
        </main>
      }
    >
      <FoodDetail params={params} />
    </Suspense>
  );
}
