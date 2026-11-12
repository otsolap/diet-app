import Link from "next/link";
import styles from "@/app/foods/foods.module.css";

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link className={styles.back} href={href}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M14.5 6.5L8.5 12l6 5.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {label}
    </Link>
  );
}
