"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isMainNavActive } from "@/src/lib/path";
import { mainNav } from "@/src/lib/site";
import styles from "./mobile-nav.module.css";

const TABS = mainNav;

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M15.5 15.5L20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IngredientsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M8 9.5h8M9 9.5V8.2A1.2 1.2 0 0 1 10.2 7h3.6A1.2 1.2 0 0 1 15 8.2v1.3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M8.2 9.5h7.6l-.7 9.2a1.5 1.5 0 0 1-1.5 1.3h-3.2a1.5 1.5 0 0 1-1.5-1.3l-.7-9.2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MealsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M5 15.5h14M7.2 15.5a4.8 4.8 0 0 1 9.6 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M12 6.2v2.2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function TabIcon({ tab }: { tab: (typeof TABS)[number]["tab"] }) {
  if (tab === "search") {
    return <SearchIcon />;
  }

  if (tab === "ingredients") {
    return <IngredientsIcon />;
  }

  return <MealsIcon />;
}

export function MobileNavFallback() {
  return (
    <nav className={styles.nav} aria-label="Mobile">
      <div className={styles.bar}>
        {TABS.map((tab) => (
          <Link className={styles.link} href={tab.href} key={tab.href}>
            <span className={styles.icon}>
              <TabIcon tab={tab.tab} />
            </span>
            <span>{tab.title}</span>
            <span className={styles.mark} />
          </Link>
        ))}
      </div>
    </nav>
  );
}

export function MobileNavClient() {
  const pathname = usePathname();

  return (
    <nav className={styles.nav} aria-label="Mobile">
      <div className={styles.bar}>
        {TABS.map((tab) => {
          const current = isMainNavActive(pathname, tab.href);

          return (
            <Link
              className={current ? `${styles.link} ${styles.linkActive}` : styles.link}
              href={tab.href}
              aria-current={current ? "page" : undefined}
              key={tab.href}
            >
              <span className={styles.icon}>
                <TabIcon tab={tab.tab} />
              </span>
              <span>{tab.title}</span>
              <span className={styles.mark} />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
