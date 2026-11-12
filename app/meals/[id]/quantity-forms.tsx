import type { MealLine } from "@/src/lib/meals";
import styles from "../meals.module.css";

export function QuantityForms({ mealIdValue, line }: { mealIdValue: string; line: MealLine }) {
  return (
    <div className={styles.stepper}>
      <form className={styles.step} method="post" action="/api/meals">
        <input type="hidden" name="intent" value="quantity" />
        <input type="hidden" name="mealId" value={mealIdValue} />
        <input type="hidden" name="itemId" value={line.id} />
        <input type="hidden" name="direction" value="down" />
        <button
          className={styles.stepButton}
          type="submit"
          disabled={line.quantity <= 1}
          aria-label={`Decrease ${line.name}`}
        >
          −
        </button>
      </form>
      <form className={styles.set} method="post" action="/api/meals">
        <input type="hidden" name="intent" value="quantity" />
        <input type="hidden" name="mealId" value={mealIdValue} />
        <input type="hidden" name="itemId" value={line.id} />
        <input type="hidden" name="direction" value="set" />
        <input
          className={styles.quantity}
          name="quantity"
          type="number"
          inputMode="numeric"
          min={1}
          max={99}
          defaultValue={line.quantity}
          aria-label={`Count for ${line.name}`}
          required
        />
      </form>
      <form className={styles.step} method="post" action="/api/meals">
        <input type="hidden" name="intent" value="quantity" />
        <input type="hidden" name="mealId" value={mealIdValue} />
        <input type="hidden" name="itemId" value={line.id} />
        <input type="hidden" name="direction" value="up" />
        <button
          className={styles.stepButton}
          type="submit"
          disabled={line.quantity >= 99}
          aria-label={`Increase ${line.name}`}
        >
          +
        </button>
      </form>
    </div>
  );
}
