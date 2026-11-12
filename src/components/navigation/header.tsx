import { Suspense } from "react";
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
      <Link className={styles.saved} href="/saved-ingredients">
        Saved
      </Link>
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
}: {
  className: string;
  slotClassName: string;
}) {
  return (
    <div className={slotClassName}>
      <Suspense fallback={<HeaderCtaFallback className={className} />}>
        <HeaderAccount className={className} />
      </Suspense>
    </div>
  );
}

export function Header() {
  const { title, slogan, links, callToAction } = site.header;
  const menuLinks = links.filter((link) => link.href !== callToAction.href);

  return (
    <div className={styles.header}>
      <header className={styles.bar}>
        <div className={styles.brand}>
          <Link className={styles.title} href="/">
            {title}
          </Link>
          {slogan ? <p className={styles.slogan}>{slogan}</p> : null}
        </div>
        <AccountSlot className={buttonClass} slotClassName={`${styles.account} ${styles.accountBar}`} />
      </header>
      {menuLinks.length > 0 || callToAction ? (
        <nav className={styles.nav} aria-label="Primary">
          <div className={styles.navInner}>
            <Suspense fallback={<HeaderMenuFallback links={menuLinks} />}>
              <HeaderMenu links={menuLinks} />
            </Suspense>
            <AccountSlot className={buttonClass} slotClassName={styles.account} />
          </div>
        </nav>
      ) : null}
    </div>
  );
}
