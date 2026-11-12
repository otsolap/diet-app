import type { ReactNode } from "react";
import { PageMain, PageTitle } from "./page-frame";

export function MissingNote({
  title,
  message,
  leading,
}: {
  title: string;
  message: string;
  leading?: ReactNode;
}) {
  return (
    <PageMain>
      {leading}
      <PageTitle>{title}</PageTitle>
      <p>{message}</p>
    </PageMain>
  );
}
