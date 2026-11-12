import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { primaryButtonClass } from "@/src/components/button/button";
import { getCurrentUser } from "@/src/lib/auth";
import { site } from "@/src/lib/site";
import {
  HeaderCta,
  HeaderCtaFallback,
  HeaderMenu,
  HeaderMenuFallback,
} from "@/src/components/navigation/header-nav";
import styles from "./header.module.css";

const buttonClass = `${primaryButtonClass} ${styles.cta}`;

async function HeaderAccount({ className }: { className: string }) {
  let user = null;

  try {
    user = await getCurrentUser();
  } catch {
    user = null;
  }

  if (!user) {
    return <HeaderCta className={className} />;
  }

  return (
    <>
      <span className={styles.email} title={user.email}>
        {user.email}
      </span>
      <form action="/api/auth/logout" method="post">
        <button className={className} type="submit">
          Log out
        </button>
      </form>
    </>
  );
}

function AccountSlot({
  className,
  slotClassName,
  fallback,
}: {
  className: string;
  slotClassName: string;
  fallback: ReactNode;
}) {
  return (
    <div className={slotClassName}>
      <Suspense fallback={fallback}>
        <HeaderAccount className={className} />
      </Suspense>
    </div>
  );
}

export function Header() {
  const { title, slogan } = site.header;

  return (
    <div className={styles.header}>
      <header className={styles.bar}>
        <div className={styles.brand}>
          <Link className={styles.title} href="/">
            {title}
          </Link>
          {slogan ? <p className={styles.slogan}>{slogan}</p> : null}
        </div>
        <AccountSlot className={buttonClass} slotClassName={`${styles.account} ${styles.accountBar}`} fallback={null} />
      </header>
      <nav className={styles.nav} aria-label="Primary">
        <div className={styles.navInner}>
          <Suspense fallback={<HeaderMenuFallback />}>
            <HeaderMenu />
          </Suspense>
          <AccountSlot
            className={buttonClass}
            slotClassName={styles.account}
            fallback={<HeaderCtaFallback className={buttonClass} />}
          />
        </div>
      </nav>
    </div>
  );
}
