import type { FoodNutrient } from "@/src/lib/food-search";
import styles from "@/app/foods/foods.module.css";

const CHART_COLORS: Record<string, string> = {
  Fat: "var(--color-secondary)",
  Protein: "var(--color-tertiary-light)",
  Carbs: "var(--color-white)",
};

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

function trimPercent(value: number) {
  return Math.round(value * 10) / 10;
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

function swatchClass(label: string) {
  if (label === "Fat") {
    return styles.swatchFat;
  }

  if (label === "Protein") {
    return styles.swatchProtein;
  }

  return styles.swatchCarbs;
}

export function MacroChart({ nutrients }: { nutrients: FoodNutrient[] }) {
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

  const amounts = new Map(nutrients.map((item) => [item.label, item.amount]));

  return (
    <figure className={styles.chart}>
      <div className={styles.pie} style={{ backgroundImage: image }} aria-hidden="true" />
      <ul className={styles.legend}>
        {parts.map((part) => (
          <li key={part.label} className={styles.legendItem}>
            <span className={`${styles.swatch} ${swatchClass(part.label)}`} aria-hidden="true" />
            <span className={styles.legendLabel}>{part.label}</span>
            <span className={styles.legendAmount}>{amounts.get(part.label)}</span>
            <span className={styles.legendShare}>{part.share}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}
