export type FoodListEntry = {
  id: number;
  name: string;
  kcal: number | null;
  foodUseClass: string | null;
  foodUseParent: string | null;
  listKey?: string;
  href?: string;
  gramsLabel?: string;
  idLabel?: string;
  kind?: "food" | "portion";
  portionId?: string;
};
