import Link from "next/link";
import styles from "@/app/foods/foods.module.css";

export function pageHref(term: string, page: number) {
  const params = new URLSearchParams({ q: term });
  if (page > 1) {
    params.set("page", String(page));
  }

  return `/ingredients?${params.toString()}`;
}

export function FoodPages({
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
