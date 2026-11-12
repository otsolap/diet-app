import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { primaryButtonClass } from "@/src/components/button/button";
import { FoodCategoryIcon } from "@/src/components/food-list/food-category-icon";
import { PortionSize } from "./portion-size";
import { getCurrentUser } from "@/src/lib/auth";
import { foodId, getFood, type FoodDetail, type FoodNutrient } from "@/src/lib/food-search";
import { isIngredientSaved } from "@/src/lib/ingredients";
import styles from "@/app/foods/foods.module.css";

export const metadata = {
  title: "Food",
};

const CRUMB_NAME_LIMIT = 36;

const CHART_COLORS: Record<string, string> = {
  Fat: "var(--color-secondary)",
  Protein: "var(--color-tertiary-light)",
  Carbs: "var(--color-white)",
};

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
          <Link className={styles.crumbLink} href="/ingredients">
            Search
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

function SaveIngredient({
  foodId,
  signedIn,
  saved,
}: {
  foodId: number;
  signedIn: boolean;
  saved: boolean;
}) {
  let control;

  if (!signedIn) {
    control = (
      <>
        <button className={`${primaryButtonClass} ${styles.save}`} type="button" disabled>
          Save ingredient
        </button>
        <p className={styles.hint}>
          <Link href="/login">Sign in</Link> to save this ingredient.
        </p>
      </>
    );
  } else if (saved) {
    control = (
      <button className={`${primaryButtonClass} ${styles.save}`} type="button" disabled>
        Saved
      </button>
    );
  } else {
    control = (
      <form className={styles.saveForm} method="post" action="/api/ingredients">
        <input type="hidden" name="foodId" value={foodId} />
        <button className={`${primaryButtonClass} ${styles.save}`} type="submit">
          Save ingredient
        </button>
      </form>
    );
  }

  return <div className={styles.saveBlock}>{control}</div>;
}

function FoodView({
  food,
  signedIn,
  saved,
}: {
  food: FoodDetail;
  signedIn: boolean;
  saved: boolean;
}) {
  return (
    <main className={styles.page}>
      <FoodCrumb current={food.name} />
      <div className={styles.titleRow}>
        <FoodCategoryIcon category={food.foodUseClass} className={styles.categoryIcon} />
        <h1 className={styles.title}>{food.name}</h1>
      </div>
      <p className={styles.foodId}>Id {food.id}</p>
      <PortionSize
        foodId={food.id}
        signedIn={signedIn}
        kcalPer100={food.kcal}
        units={food.units}
        nutrients={food.basis}
      >
        {food.nutrients.length > 0 ? <MacroChart nutrients={food.nutrients} /> : null}
      </PortionSize>
      <SaveIngredient foodId={food.id} signedIn={signedIn} saved={saved} />
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

  let signedIn = false;
  let saved = false;

  try {
    const user = await getCurrentUser();
    signedIn = Boolean(user);
    if (user) {
      saved = await isIngredientSaved(user.id, result.food.id);
    }
  } catch {
    signedIn = false;
    saved = false;
  }

  return <FoodView food={result.food} signedIn={signedIn} saved={saved} />;
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
