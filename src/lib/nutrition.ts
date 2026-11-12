const KJ_PER_KCAL = 4.184;

export const DETAIL_NUTRIENTS = [
  { code: "FAT", label: "Fat", kcalPerGram: 9 },
  { code: "PROT", label: "Protein", kcalPerGram: 4 },
  { code: "CHOAVL", label: "Carbs", kcalPerGram: 4 },
] as const;

export const NUTRIENT_CODES = DETAIL_NUTRIENTS.map((item) => item.code);

export function kcalFromKj(value: string | null) {
  if (value === null) {
    return null;
  }

  const kj = Number(value);
  if (!Number.isFinite(kj)) {
    return null;
  }

  return Math.round(kj / KJ_PER_KCAL);
}

export function shareLabel(value: number, kcalPerGram: number, kcal: number | null) {
  if (kcal === null || kcal <= 0) {
    return null;
  }

  return `${Math.round((value * kcalPerGram * 100) / kcal)}%`;
}

export function amountLabel(value: number) {
  const text = new Intl.NumberFormat("en", { maximumFractionDigits: 1 }).format(value);
  return `${text} g`;
}

export function gramsLabel(grams: number) {
  const text = new Intl.NumberFormat("en", { maximumFractionDigits: 2 }).format(grams);
  return `${text} g`;
}

export function gramsInput(grams: number) {
  return new Intl.NumberFormat("en", { maximumFractionDigits: 2, useGrouping: false }).format(grams);
}
