import { Suspense, type ReactNode } from "react";
import styles from "@/app/foods/foods.module.css";

export function PageMain({ children }: { children: ReactNode }) {
  return <main className={styles.page}>{children}</main>;
}

export function PageTitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const titleClass = className ? `${styles.title} ${className}` : styles.title;

  return <h1 className={titleClass}>{children}</h1>;
}

export function PageFallback({ title }: { title: string }) {
  return (
    <PageMain>
      <PageTitle>{title}</PageTitle>
      <p>Loading.</p>
    </PageMain>
  );
}

export function DynamicPage({ title, children }: { title: string; children: ReactNode }) {
  return <Suspense fallback={<PageFallback title={title} />}>{children}</Suspense>;
}
