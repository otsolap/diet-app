export function formatKcal(kcal: number | null) {
  if (kcal === null) {
    return "No energy value";
  }

  return `${new Intl.NumberFormat("en").format(kcal)} kcal`;
}
