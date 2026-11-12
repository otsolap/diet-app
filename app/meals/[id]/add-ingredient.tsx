import foodStyles from "@/app/foods/foods.module.css";
import { Button } from "@/src/components/button/button";
import type { MealChoice } from "@/src/lib/meals";
import styles from "../meals.module.css";

function choiceGroups(choices: MealChoice[]) {
  const saved = choices.filter((choice) => choice.group === "Ingredients");
  const portions = choices.filter((choice) => choice.group === "Portions");

  return [
    { label: "Ingredients", items: saved },
    { label: "Portions", items: portions },
  ].filter((group) => group.items.length > 0);
}

export function AddIngredient({ mealIdValue, choices }: { mealIdValue: string; choices: MealChoice[] }) {
  const groups = choiceGroups(choices);
  if (groups.length === 0) {
    return (
      <p className={`${foodStyles.hint} ${foodStyles.controls}`}>
        Save an ingredient or add a portion first.
      </p>
    );
  }

  return (
    <form className={`${styles.addForm} ${foodStyles.controls}`} method="post" action="/api/meals">
      <input type="hidden" name="intent" value="add" />
      <input type="hidden" name="mealId" value={mealIdValue} />
      <label className={foodStyles.field}>
        <span className={foodStyles.srOnly}>Ingredient</span>
        <select className={styles.select} name="item" required defaultValue="">
          <option value="">Choose an ingredient</option>
          {groups.map((group) => (
            <optgroup key={group.label} label={group.label}>
              {group.items.map((choice) => (
                <option key={choice.value} value={choice.value}>
                  {choice.name} ({choice.detail})
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>
      <Button variant="secondary" className={styles.add}>
        Add ingredient
      </Button>
    </form>
  );
}
