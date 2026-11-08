"use client";

import { useEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { site, type SiteLink } from "@/src/lib/site";
import { isCurrentPath } from "@/src/lib/path";
import styles from "./mobile-nav.module.css";

const PRIMARY_PAGES = 3;

function BarIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg
        viewBox="0 0 24 24"
        width="1.875rem"
        height="1.875rem"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      width="1.875rem"
      height="1.875rem"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function ItemLink({
  link,
  pathname,
  className,
  labeled = false,
  onNavigate,
}: {
  link: SiteLink;
  pathname?: string;
  className: string;
  labeled?: boolean;
  onNavigate?: () => void;
}) {
  const current = pathname ? isCurrentPath(pathname, link.href) : false;

  return (
    <Link
      className={current ? `${className} ${styles.linkActive}` : className}
      href={link.href}
      aria-current={current ? "page" : undefined}
      onClick={onNavigate}
    >
      {labeled ? <span className={styles.label}>{link.title}</span> : link.title}
    </Link>
  );
}

function MobileNavFrame({
  pathname,
  open = false,
  navRef,
  onToggle,
  onClose,
}: {
  pathname?: string;
  open?: boolean;
  navRef?: RefObject<HTMLElement | null>;
  onToggle?: () => void;
  onClose?: () => void;
}) {
  const links = site.header.links;
  const primary = links.slice(0, PRIMARY_PAGES);
  const extra = links.slice(PRIMARY_PAGES);

  if (primary.length === 0) {
    return null;
  }

  const itemCount = primary.length + (extra.length > 0 ? 1 : 0);

  return (
    <>
      {extra.length > 0 ? (
        <div
          className={open ? `${styles.sidebar} ${styles.sidebarOpen}` : styles.sidebar}
          id="mobile-sidebar"
          role="dialog"
          aria-label="Menu"
          aria-hidden={!open}
          inert={open ? undefined : true}
        >
          <ul className={styles.list}>
            {extra.map((link) => (
              <li className={styles.item} key={link.href}>
                <ItemLink
                  link={link}
                  pathname={pathname}
                  className={styles.sidebarLink}
                  onNavigate={onClose}
                />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <nav
        ref={navRef}
        className={styles.nav}
        aria-label="Mobile"
        style={{ "--mobile-nav-count": itemCount } as CSSProperties}
      >
        <div className={styles.bar}>
          {primary.map((link) => (
            <ItemLink
              key={link.href}
              link={link}
              pathname={pathname}
              className={styles.link}
              labeled
              onNavigate={onClose}
            />
          ))}
          {extra.length > 0 ? (
            <button
              className={styles.toggle}
              type="button"
              aria-expanded={open}
              aria-controls="mobile-sidebar"
              onClick={onToggle}
            >
              <span className={styles.icon}>
                <BarIcon open={open} />
              </span>
              <span className={styles.label}>{open ? "Close" : "Menu"}</span>
            </button>
          ) : null}
        </div>
      </nav>
    </>
  );
}

export function MobileNavFallback() {
  return <MobileNavFrame />;
}

export function MobileNavClient() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const openRef = useRef(false);

  function setMenu(next: boolean) {
    openRef.current = next;
    setOpen(next);
    if (navRef.current) {
      navRef.current.style.opacity = "1";
    }
  }

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) {
      return;
    }

    const bar = nav;
    let lastScrollY = window.scrollY;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && openRef.current) {
        openRef.current = false;
        setOpen(false);
        bar.style.opacity = "1";
      }
    }

    function onScroll() {
      if (openRef.current) {
        bar.style.opacity = "1";
        return;
      }

      const y = window.scrollY;
      bar.style.opacity = y > lastScrollY ? ".5" : "1";
      lastScrollY = y;
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <MobileNavFrame
      pathname={pathname}
      open={open}
      navRef={navRef}
      onToggle={() => setMenu(!openRef.current)}
      onClose={() => setMenu(false)}
    />
  );
}
