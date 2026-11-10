import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { ErrorText, AuthShell } from "@/app/auth/shell";
import styles from "@/app/auth/auth.module.css";
import { primaryButtonClass } from "@/src/components/button/button";
import { countUsers, getCurrentUser } from "@/src/lib/auth";
import { errorMessage } from "@/src/lib/http";

export const metadata = {
  title: "Sign in",
};

function firstCode(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function LoginForm({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  let user = null;

  try {
    user = await getCurrentUser();
  } catch {
    user = null;
  }

  if (user) {
    redirect("/");
  }

  const params = await searchParams;
  const message = errorMessage(firstCode(params.error));
  const openSetup = (await countUsers()) === 0;

  return (
    <AuthShell title="Sign in">
      <ErrorText message={message} />
      <form className={styles.form} method="post" action="/api/auth/login">
        <label className={styles.field}>
          Email
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <label className={styles.field}>
          Password
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </label>
        <button className={`${primaryButtonClass} ${styles.submit}`} type="submit">
          Sign in
        </button>
      </form>
      {openSetup ? <Link href="/setup">Create the owner account</Link> : null}
    </AuthShell>
  );
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<AuthShell title="Sign in">Loading.</AuthShell>}>
      <LoginForm searchParams={searchParams} />
    </Suspense>
  );
}
