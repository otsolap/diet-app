import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import styles from "@/app/foods/foods.module.css";
import { Button } from "@/src/components/button/button";
import { RemoveButton } from "@/src/components/form/remove-button";
import { TextField } from "@/src/components/form/text-field";
import { DynamicPage, PageMain, PageTitle } from "@/src/components/page/page-frame";
import { MissingNote } from "@/src/components/page/missing-note";
import { FoodCategoryIcon } from "@/src/components/food-list/food-category-icon";
import { requireUser } from "@/src/lib/auth";
import { formatKcal } from "@/src/lib/format";
import { firstQueryValue } from "@/src/lib/query";
import { gramsInput } from "@/src/lib/nutrition";
import { getPortion, portionId } from "@/src/lib/portions";

export const metadata: Metadata = {
  title: "Portion",
};

function PortionMissing() {
  return <MissingNote title="Portion not found" message="That portion is not available." />;
}

async function PortionView({ params, searchParams }: PageProps<"/portions/[id]">) {
  await connection();
  const user = await requireUser();
  const { id } = await params;
  const query = await searchParams;
  const parsed = portionId(id);
  if (!parsed) {
    return <PortionMissing />;
  }

  const portion = await getPortion(user.id, parsed);
  if (!portion) {
    return <PortionMissing />;
  }

  return (
    <PageMain>
      <div className={styles.titleRow}>
        <FoodCategoryIcon category={portion.foodUseClass} className={styles.categoryIcon} />
        <PageTitle>{portion.name}</PageTitle>
      </div>
      <p className={styles.foodId}>{portion.gramsLabel}</p>
      <p className={styles.source}>
        From <Link href={`/ingredients/${portion.foodId}`}>{portion.foodName}</Link>
      </p>
      <form className={styles.form} method="post" action="/api/portions">
        <input type="hidden" name="intent" value="update" />
        <input type="hidden" name="portionId" value={portion.id} />
        <TextField
          className={styles.field}
          label="Name"
          name="name"
          type="text"
          maxLength={80}
          required
          defaultValue={portion.name}
        />
        <TextField
          className={styles.field}
          label="Grams"
          name="grams"
          type="number"
          required
          min={0.1}
          max={9999}
          step={0.1}
          defaultValue={gramsInput(portion.grams)}
        />
        <Button className={styles.submit}>Update</Button>
      </form>
      {firstQueryValue(query.error) === "values" ? (
        <p className={styles.error}>Enter a name and a weight in grams.</p>
      ) : null}
      <p className={styles.kcal}>
        {formatKcal(portion.kcal)}
      </p>
      <RemoveButton
        action="/api/portions"
        idName="portionId"
        idValue={portion.id}
        label="Remove portion"
        className={styles.remove}
      />
      {portion.nutrients.length > 0 ? (
        <table className={styles.nutrients}>
          <thead>
            <tr>
              <th className={styles.heading} scope="col">
                Macro
              </th>
              <th className={styles.headingValue} scope="col">
                Grams
              </th>
              <th className={styles.headingValue} scope="col">
                Percent
              </th>
            </tr>
          </thead>
          <tbody>
            {portion.nutrients.map((item) => (
              <tr key={item.label}>
                <th className={styles.macro} scope="row">
                  {item.label}
                </th>
                <td className={styles.amount}>{item.amount}</td>
                <td className={styles.share}>{item.share}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </PageMain>
  );
}

export default function PortionPage({
  params,
  searchParams,
}: PageProps<"/portions/[id]">) {
  return (
    <DynamicPage title="Portion">
      <PortionView params={params} searchParams={searchParams} />
    </DynamicPage>
  );
}
