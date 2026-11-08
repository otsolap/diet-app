import type { Metadata } from "next";
import Image from "next/image";
import { SocialLinks } from "@/src/components/social-links/social-links";
import styles from "./about.module.css";

export const metadata: Metadata = {
  title: "About",
};

export default function AboutPage() {
  return (
    <main className={styles.about}>
      <div className={styles.intro}>
        <figure className={styles.photo}>
          <Image
            className={styles.image}
            src="/about/otso.jpg"
            alt="Otso Lappalainen"
            width={1328}
            height={1488}
            sizes="(min-width: 1024px) 20rem, (min-width: 768px) 16rem, 100vw"
            priority
          />
        </figure>
        <div className={styles.who}>
          <h1 className={styles.heading}>Who am I?</h1>
          <p className={styles.name}>Otso Lappalainen</p>
          <p>
            I&apos;m not just a digital enthusiast; I live and breathe the online realm. While many
            know me as a web wizard, I pride myself on being a tech-savvy digital nomad, constantly
            on the move yet always connected. My passion extends beyond crafting intricate websites
            and delves deep into enhancing customer experiences, informed by data-driven insights
            from web analytics.
          </p>
          <p>
            Beyond the screen, my zeal for life finds me sweating it out in the gym and practicing
            the disciplined art of Muay Thai boxing. This combination of mental acuity and physical
            dedication shapes me into a versatile professional, ready to tackle challenges with both
            analytical precision and boundless energy.
          </p>
        </div>
      </div>
      <section className={styles.team} aria-labelledby="dream-team-heading">
        <h2 id="dream-team-heading" className={styles.heading}>
          We Will Make a Dream Team If:
        </h2>
        <p>
          Success in the digital arena demands action, resilience, strategic insight, and unwavering
          commitment. If these traits resonate with you, we&apos;re set to turn ambitious goals into
          impactful realities. Together, we can forge a partnership destined for digital triumph.
        </p>
      </section>
      <section className={styles.social} aria-labelledby="follow-heading">
        <h2 id="follow-heading" className={styles.heading}>
          Follow
        </h2>
        <SocialLinks />
      </section>
    </main>
  );
}
