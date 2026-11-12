import { Button } from "@/src/components/button/button";
import styles from "@/app/foods/foods.module.css";

export function SaveIngredient({ foodId, saved }: { foodId: number; saved: boolean }) {
  const control = saved ? (
    <button className={styles.savedButton} type="button" disabled>
      Saved
    </button>
  ) : (
    <form className={styles.saveForm} method="post" action="/api/ingredients">
      <input type="hidden" name="foodId" value={foodId} />
      <Button className={styles.save}>Save</Button>
    </form>
  );

  return <div className={styles.saveBar}>{control}</div>;
}
