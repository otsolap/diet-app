import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { FoodList } from "@/src/components/food-list/food-list";
import { getCurrentUser } from "@/src/lib/auth";
import { searchFoods } from "@/src/lib/food-search";
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
  const page = result && "page" in result ? result.page : 1;
  const pageCount = result && "pageCount" in result ? result.pageCount : 0;
  const viewer = term && !error ? await viewerFoods(term) : { savedIds: new Set<number>(), portions: [] };
  const rows = [...foods, ...viewer.portions];

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Search</h1>
      <form className={styles.searchForm} method="get" action="/ingredients">
        <label className={styles.searchField}>
          <span className={styles.srOnly}>Search</span>
          <svg className={styles.searchIcon} viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M15.5 15.5L20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input name="q" type="search" defaultValue={term} maxLength={80} placeholder="Search" required />
        </label>
      </form>
      {error ? <p className={styles.error}>{error}</p> : null}
      {rows.length > 0 ? (
        <>
          <FoodList foods={rows} savedIds={viewer.savedIds} returnTo={term ? pageHref(term, page) : undefined} />
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
