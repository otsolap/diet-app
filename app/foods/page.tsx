import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { primaryButtonClass } from "@/src/components/button/button";
import { FOOD_PAGE_SIZE, searchFoods, type FoodListItem } from "@/src/lib/food-search";
import styles from "./foods.module.css";

export const metadata = {
  title: "Foods",
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function energyLabel(kcal: number) {
  return `${new Intl.NumberFormat("en").format(kcal)} kcal per 100 g`;
}

function pageNumber(value: string | undefined) {
  if (!value || !/^[1-9]\d{0,5}$/.test(value)) {
    return 1;
  }

  return Number(value);
}

function pageHref(term: string, page: number) {
  const params = new URLSearchParams({ q: term });
  if (page > 1) {
    params.set("page", String(page));
  }

  return `/foods?${params.toString()}`;
}

function countLabel(total: number, page: number) {
  if (total === 1) {
    return "1 food";
  }

  if (total <= FOOD_PAGE_SIZE) {
    return `${total} foods`;
  }

  const start = (page - 1) * FOOD_PAGE_SIZE + 1;
  const end = Math.min(page * FOOD_PAGE_SIZE, total);
  if (start === end) {
    return `${start} of ${total} foods`;
  }

  return `${start}–${end} of ${total} foods`;
}

function FoodPages({
  term,
  page,
  pageCount,
  label,
}: {
  term: string;
  page: number;
  pageCount: number;
  label: string;
}) {
  if (pageCount <= 1) {
    return null;
  }

  return (
    <nav className={styles.pages} aria-label={label}>
      {page > 1 ? (
        <Link className={styles.pageLink} href={pageHref(term, page - 1)}>
          Previous
        </Link>
      ) : (
        <span className={styles.pageMuted}>Previous</span>
      )}
      <span>
        Page {page} of {pageCount}
      </span>
      {page < pageCount ? (
        <Link className={styles.pageLink} href={pageHref(term, page + 1)}>
          Next
        </Link>
      ) : (
        <span className={styles.pageMuted}>Next</span>
      )}
    </nav>
  );
}

function FoodList({ foods }: { foods: FoodListItem[] }) {
  return (
    <ul className={styles.list}>
        {foods.map((food) => (
          <li key={food.id}>
            <Link className={styles.item} href={`/foods/${food.id}`}>
              <span className={styles.name}>{food.name}</span>
              <span className={styles.energy}>
                {food.kcal === null ? "No energy value" : energyLabel(food.kcal)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
  );
}

async function FoodSearch({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();

  const params = await searchParams;
  const term = firstValue(params.q)?.trim() ?? "";
  const result = term ? await searchFoods(term, pageNumber(firstValue(params.page))) : null;
  const error = result && "error" in result ? result.error : null;
  const foods = result && "foods" in result ? result.foods : [];
  const total = result && "total" in result ? result.total : 0;
  const page = result && "page" in result ? result.page : 1;
  const pageCount = result && "pageCount" in result ? result.pageCount : 0;

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Foods</h1>
      <form className={styles.form} method="get" action="/foods">
        <label className={styles.field}>
          Search
          <input
            name="q"
            type="search"
            defaultValue={term}
            maxLength={80}
            placeholder="Potato"
            required
          />
        </label>
        <button className={`${primaryButtonClass} ${styles.submit}`} type="submit">
          Search
        </button>
      </form>
      {error ? <p className={styles.error}>{error}</p> : null}
      {foods.length > 0 ? (
        <>
          <p className={styles.count}>{countLabel(total, page)}</p>
          <FoodPages term={term} page={page} pageCount={pageCount} label="Pages" />
          <FoodList foods={foods} />
          <FoodPages term={term} page={page} pageCount={pageCount} label="Pages after the list" />
        </>
      ) : null}
      {term && !error && foods.length === 0 ? <p>No foods match that search.</p> : null}
    </main>
  );
}

export default function FoodsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense
      fallback={
        <main className={styles.page}>
          <h1 className={styles.title}>Foods</h1>
          <p>Loading.</p>
        </main>
      }
    >
      <FoodSearch searchParams={searchParams} />
    </Suspense>
  );
}
