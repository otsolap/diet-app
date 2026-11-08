"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SiteLink } from "@/src/lib/site";
import { site } from "@/src/lib/site";
import { isCurrentPath } from "@/src/lib/path";
import styles from "./header.module.css";

function Menu({
  links,
  pathname,
}: {
  links: SiteLink[];
  pathname?: string;
}) {
  return (
    <div className={styles.menu}>
      {links.map((link) => {
        const current = pathname ? isCurrentPath(pathname, link.href) : false;

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

export function HeaderMenuFallback({ links }: { links: SiteLink[] }) {
  return <Menu links={links} />;
}

export function HeaderMenu({ links }: { links: SiteLink[] }) {
  const pathname = usePathname();

  return <Menu links={links} pathname={pathname} />;
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
