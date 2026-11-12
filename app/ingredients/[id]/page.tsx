import type { Metadata } from "next";
import { connection } from "next/server";
import { BackLink } from "@/src/components/page/back-link";
import { DynamicPage, PageMain, PageTitle } from "@/src/components/page/page-frame";
import { MissingNote } from "@/src/components/page/missing-note";
import { MacroChart } from "./macro-chart";
import { PortionSize } from "./portion-size";
import { SaveIngredient } from "./save-ingredient";
import { getCurrentUser } from "@/src/lib/auth";
import { formatKcal } from "@/src/lib/format";
import { foodId, getFood, type FoodDetail } from "@/src/lib/food-search";
import { isIngredientSaved } from "@/src/lib/ingredients";
import styles from "@/app/foods/foods.module.css";

export const metadata: Metadata = {
  title: "Food",
};

function FoodMissing() {
  return (
    <MissingNote
      title="Food not found"
      message="That food is not available."
      leading={<BackLink href="/ingredients" label="Search" />}
    />
  );
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
    <PageMain>
      <BackLink href="/ingredients" label="Search" />
      <div className={styles.hero}>
        <PageTitle>{food.name}</PageTitle>
        <p className={styles.heroEnergy}>
          {formatKcal(food.kcal)}
        </p>
        {food.kcal === null ? null : <p className={styles.perNote}>per 100 g</p>}
      </div>
      {food.nutrients.length > 0 ? <MacroChart nutrients={food.nutrients} /> : null}
      <PortionSize
        foodId={food.id}
        signedIn={signedIn}
        kcalPer100={food.kcal}
        units={food.units}
        nutrients={food.basis}
        actions={<SaveIngredient foodId={food.id} saved={saved} />}
      />
    </PageMain>
  );
}

async function FoodDetail({ params }: Pick<PageProps<"/ingredients/[id]">, "params">) {
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
      <PageMain>
        <BackLink href="/ingredients" label="Search" />
        <PageTitle>Food</PageTitle>
        <p className={styles.error}>{result.error}</p>
      </PageMain>
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

export default function FoodPage({ params }: PageProps<"/ingredients/[id]">) {
  return (
    <DynamicPage title="Food">
      <FoodDetail params={params} />
    </DynamicPage>
  );
}
