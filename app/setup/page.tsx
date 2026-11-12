import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { ErrorText, AuthShell } from "@/app/auth/shell";
import styles from "@/app/auth/auth.module.css";
import { Button } from "@/src/components/button/button";
import { TextField } from "@/src/components/form/text-field";
import { bootstrapEmail, countUsers } from "@/src/lib/auth";
import { errorMessage } from "@/src/lib/http";
import { firstQueryValue } from "@/src/lib/query";

export const metadata: Metadata = {
  title: "Create owner account",
};

async function SetupForm({
  searchParams,
}: Pick<PageProps<"/setup">, "searchParams">) {
  await connection();

  if ((await countUsers()) > 0) {
    redirect("/login");
  }

  const params = await searchParams;
  const message = errorMessage(firstQueryValue(params.error));
  const ownerEmail = bootstrapEmail();

  return (
    <AuthShell title="Create the owner account">
      <p className={styles.note}>
        This page works once. After that, new people need an invite link.
      </p>
      <ErrorText message={message} />
      {ownerEmail ? (
        <form className={styles.form} method="post" action="/api/auth/setup">
          <TextField className={styles.field} label="Email" name="email" type="email" autoComplete="email" required />
          <TextField
            className={styles.field}
            label="Password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={12}
            required
          />
          <TextField
            className={styles.field}
            label="Confirm password"
            name="confirm"
            type="password"
            autoComplete="new-password"
            minLength={12}
            required
          />
          <Button className={styles.submit}>Create account</Button>
        </form>
      ) : (
        <p className={styles.error}>
          Set AUTH_BOOTSTRAP_EMAIL before you create the owner account.
        </p>
      )}
      <Link href="/login">Sign in</Link>
    </AuthShell>
  );
}

export default function SetupPage({ searchParams }: PageProps<"/setup">) {
  return (
    <Suspense fallback={<AuthShell title="Create the owner account">Loading.</AuthShell>}>
      <SetupForm searchParams={searchParams} />
    </Suspense>
  );
}
