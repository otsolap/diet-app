import { Suspense } from "react";
import Link from "next/link";
import { primaryButtonClass } from "@/src/components/button/button";
import { site } from "@/src/lib/site";
import {
  HeaderCta,
  HeaderCtaFallback,
  HeaderMenu,
  HeaderMenuFallback,
} from "@/src/components/navigation/header-nav";
import styles from "./header.module.css";

const barCtaClass = `${primaryButtonClass} ${styles.cta} ${styles.ctaBar}`;
const navCtaClass = `${primaryButtonClass} ${styles.cta}`;

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
        <Suspense fallback={<HeaderCtaFallback className={barCtaClass} />}>
          <HeaderCta className={barCtaClass} />
        </Suspense>
      </header>
      {menuLinks.length > 0 || callToAction ? (
        <nav className={styles.nav} aria-label="Primary">
          <div className={styles.navInner}>
            <Suspense fallback={<HeaderMenuFallback links={menuLinks} />}>
              <HeaderMenu links={menuLinks} />
            </Suspense>
            <Suspense fallback={<HeaderCtaFallback className={navCtaClass} />}>
              <HeaderCta className={navCtaClass} />
            </Suspense>
          </div>
        </nav>
      ) : null}
    </div>
  );
}
