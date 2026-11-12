import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { primaryButtonClass } from "@/src/components/button/button";
import { FoodList } from "@/src/components/food-list/food-list";
import { getCurrentUser } from "@/src/lib/auth";
import { FOOD_PAGE_SIZE, searchFoods } from "@/src/lib/food-search";
import { listSavedFoodIds } from "@/src/lib/ingredients";
import { portionEntry, searchPortions } from "@/src/lib/portions";
import styles from "@/app/foods/foods.module.css";

export const metadata = {
  title: "Search",
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
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

  return `/ingredients?${params.toString()}`;
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

async function viewerFoods(term: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { savedIds: new Set<number>(), portions: [] };
    }

    const [savedIds, portions] = await Promise.all([
      listSavedFoodIds(user.id),
      searchPortions(user.id, term).catch(() => []),
    ]);

    return { savedIds: new Set(savedIds), portions: portions.map(portionEntry) };
  } catch {
    return { savedIds: new Set<number>(), portions: [] };
  }
}

function FoodPages({
  term,
  page,
  pageCount,
}: {
  term: string;
  page: number;
  pageCount: number;
}) {
  if (pageCount <= 1) {
    return null;
  }

  return (
    <nav className={styles.pages} aria-label="Pages">
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
  const viewer = term && !error ? await viewerFoods(term) : { savedIds: new Set<number>(), portions: [] };
  const rows = [...foods, ...viewer.portions];

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Search</h1>
      <form className={styles.form} method="get" action="/ingredients">
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
      {rows.length > 0 ? (
        <>
          {foods.length > 0 ? <p className={styles.count}>{countLabel(total, page)}</p> : null}
          <FoodList foods={rows} savedIds={viewer.savedIds} />
          <FoodPages term={term} page={page} pageCount={pageCount} />
        </>
      ) : null}
      {term && !error && rows.length === 0 ? <p>No foods match that search.</p> : null}
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
          <h1 className={styles.title}>Search</h1>
          <p>Loading.</p>
        </main>
      }
    >
      <FoodSearch searchParams={searchParams} />
    </Suspense>
  );
}
