"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { mainNav, site } from "@/src/lib/site";
import { isCurrentPath, isMainNavActive } from "@/src/lib/path";
import styles from "./header.module.css";

function Menu({ pathname }: { pathname?: string }) {
  return (
    <div className={styles.menu}>
      {mainNav.map((link) => {
        const current = pathname ? isMainNavActive(pathname, link.href) : false;

        return (
          <Link
            key={link.href}
            className={current ? `${styles.link} ${styles.linkActive}` : styles.link}
            href={link.href}
            aria-current={current ? "page" : undefined}
          >
            {link.title}
          </Link>
        );
      })}
    </div>
  );
}

export function HeaderMenuFallback() {
  return <Menu />;
}

export function HeaderMenu() {
  const pathname = usePathname();

  return <Menu pathname={pathname} />;
}

function Cta({ className, current }: { className: string; current?: boolean }) {
  const callToAction = site.header.callToAction;

  return (
    <Link
      className={className}
      href={callToAction.href}
      aria-current={current ? "page" : undefined}
    >
      {callToAction.title}
    </Link>
  );
}

export function HeaderCtaFallback({ className }: { className: string }) {
  return <Cta className={className} />;
}

export function HeaderCta({ className }: { className: string }) {
  const pathname = usePathname();
  const current = isCurrentPath(pathname, site.header.callToAction.href);

  return <Cta className={className} current={current} />;
}
