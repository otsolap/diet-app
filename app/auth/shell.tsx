import type { ReactNode } from "react";
import styles from "./auth.module.css";

export function AuthShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <main className={styles.wrap}>
      <section className={styles.card}>
        <h1>{title}</h1>
        {children}
      </section>
    </main>
  );
}

export function ErrorText({ message }: { message: string | null }) {
  if (!message) {
    return null;
  }

  return <p className={styles.error}>{message}</p>;
}
