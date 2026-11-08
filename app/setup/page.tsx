import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { ErrorText, AuthShell } from "@/app/auth/shell";
import styles from "@/app/auth/auth.module.css";
import { primaryButtonClass } from "@/src/components/button/button";
import { bootstrapEmail, countUsers } from "@/src/lib/auth";
import { errorMessage } from "@/src/lib/http";

export const metadata = {
  title: "Create owner account",
};

function firstCode(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function SetupForm({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();

  if ((await countUsers()) > 0) {
    redirect("/login");
  }

  const params = await searchParams;
  const message = errorMessage(firstCode(params.error));
  const ownerEmail = bootstrapEmail();

  return (
    <AuthShell title="Create the owner account">
      <p className={styles.note}>
        This page works once. After that, new people need an invite link.
      </p>
      <ErrorText message={message} />
      {ownerEmail ? (
        <form className={styles.form} method="post" action="/api/auth/setup">
          <label className={styles.field}>
            Email
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label className={styles.field}>
            Password
            <input
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={12}
              required
            />
          </label>
          <label className={styles.field}>
            Confirm password
            <input
              name="confirm"
              type="password"
              autoComplete="new-password"
              minLength={12}
              required
            />
          </label>
          <button className={`${primaryButtonClass} ${styles.submit}`} type="submit">
            Create account
          </button>
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

export default function SetupPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<AuthShell title="Create the owner account">Loading.</AuthShell>}>
      <SetupForm searchParams={searchParams} />
    </Suspense>
  );
}
