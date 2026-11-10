import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { SocialLinks } from "@/src/components/social-links/social-links";
import { getCurrentUser } from "@/src/lib/auth";
import { site, type SiteLink } from "@/src/lib/site";
import styles from "./footer.module.css";

function FooterAnchor({ link, className }: { link: SiteLink; className: string }) {
  if (link.isExternal) {
    return (
      <a
        className={className}
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
      >
        {link.title}
      </a>
    );
  }

  return (
    <Link className={className} href={link.href}>
      {link.title}
    </Link>
  );
}

function SubFooter({ year }: { year?: number }) {
  const { title, credit, fineli, license } = site.footer.subFooter;

  return (
    <div className={styles.sub}>
      <div className={styles.subInner}>
        <span className={styles.brand}>
          {title}
          {year ? ` © ${year}` : null}
        </span>
        <span className={styles.pipe}> | </span>
        <span className={styles.legal}>
          {credit} <FooterAnchor className={styles.legal} link={fineli} />
          {", "}
          <FooterAnchor className={styles.legal} link={license} />
        </span>
      </div>
    </div>
  );
}

async function SubFooterYear() {
  await connection();

  return <SubFooter year={new Date().getFullYear()} />;
}

function PageLinks({ links }: { links: SiteLink[] }) {
  return (
    <div className={styles.links}>
      {links.map((link) => (
        <FooterAnchor key={link.href} className={styles.link} link={link} />
      ))}
    </div>
  );
}

async function FooterPageLinks() {
  let user = null;

  try {
    user = await getCurrentUser();
  } catch {
    user = null;
  }

  const links = user
    ? site.footer.pages.links.filter((link) => link.href !== "/login")
    : site.footer.pages.links;

  return <PageLinks links={links} />;
}

export function Footer() {
  const { pages, brand } = site.footer;

  return (
    <footer className={styles.footer}>
      <div className={styles.columns}>
        <div className={styles.column}>
          <h3 className={styles.heading}>{pages.title}</h3>
          <Suspense fallback={<PageLinks links={pages.links} />}>
            <FooterPageLinks />
          </Suspense>
        </div>
        <div className={styles.column}>
          <h3 className={styles.heading}>{brand.title}</h3>
          <p className={styles.text}>{brand.description}</p>
          <SocialLinks />
        </div>
      </div>
      <Suspense fallback={<SubFooter />}>
        <SubFooterYear />
      </Suspense>
    </footer>
  );
}
