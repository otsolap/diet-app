import { mdiNote } from "@mdi/js";
import { foodCategoryIcon } from "./category-icons";

export function FoodCategoryIcon({
  category,
  saved = false,
  className,
}: {
  category: string | null;
  saved?: boolean;
  className: string;
}) {
  return (
    <span className={className} aria-hidden="true">
      <svg viewBox="0 0 24 24">
        <path fill="currentColor" d={saved ? mdiNote : foodCategoryIcon(category)} />
      </svg>
    </span>
  );
}
