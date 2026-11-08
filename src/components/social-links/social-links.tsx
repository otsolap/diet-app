import styles from "./social-links.module.css";

const links = [
  {
    href: "https://x.com/@otso_lap",
    label: "x.com/@otso_lap",
    icon: styles.iconX,
  },
  {
    href: "https://www.linkedin.com/in/otsolap/",
    label: "linkedin.com/in/otsolap/",
    icon: styles.iconLinkedin,
  },
  {
    href: "https://varangianventure.com/",
    label: "Portfolio: Varangian Venture",
    icon: styles.iconWeb,
  },
];

export function SocialLinks() {
  return (
    <ul className={styles.list}>
      {links.map((link) => (
        <li key={link.href}>
          <a
            className={styles.link}
            href={link.href}
            target="_blank"
            rel="noreferrer"
          >
            <span className={styles.iconWrap}>
              <span className={`${styles.icon} ${link.icon}`} aria-hidden="true" />
            </span>
            {link.label}
          </a>
        </li>
      ))}
    </ul>
  );
}
