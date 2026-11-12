import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { SocialLinks } from "@/src/components/social-links/social-links";
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
          {credit} <FooterAnchor className={styles.legalLink} link={fineli} />
          {", "}
          <FooterAnchor className={styles.legalLink} link={license} />
        </span>
      </div>
    </div>
  );
}

async function SubFooterYear() {
  await connection();

  return <SubFooter year={new Date().getFullYear()} />;
}

export function Footer() {
  const { brand, about } = site.footer;

  return (
    <footer className={styles.footer}>
      <div className={styles.columns}>
        <div className={styles.column}>
          <div className={styles.logo}>
            <img className={styles.logoMark} src="/logo.png" alt="" width={192} height={192} />
            <span className={styles.logoTitle}>{brand.title}</span>
          </div>
          <p className={styles.text}>{brand.description}</p>
        </div>
        <div className={styles.column}>
          <h3 className={styles.heading}>{about.title}</h3>
          <div className={styles.links}>
            <Link className={styles.link} href={about.link.href}>
              {about.link.title}
            </Link>
          </div>
          <SocialLinks />
        </div>
      </div>
      <Suspense fallback={<SubFooter />}>
        <SubFooterYear />
      </Suspense>
    </footer>
  );
}
