import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { ErrorText, AuthShell } from "@/app/auth/shell";
import styles from "@/app/auth/auth.module.css";
import { Button } from "@/src/components/button/button";
import { TextField } from "@/src/components/form/text-field";
import { countUsers, getCurrentUser } from "@/src/lib/auth";
import { errorMessage } from "@/src/lib/http";
import { firstQueryValue } from "@/src/lib/query";

export const metadata: Metadata = {
  title: "Sign in",
};

async function LoginForm({
  searchParams,
}: Pick<PageProps<"/login">, "searchParams">) {
  await connection();
  let user = null;

  try {
    user = await getCurrentUser();
  } catch {
    user = null;
  }

  if (user) {
    redirect("/saved-ingredients");
  }

  const params = await searchParams;
  const message = errorMessage(firstQueryValue(params.error));
  const openSetup = (await countUsers()) === 0;

  return (
    <AuthShell title="Sign in">
      <ErrorText message={message} />
      <form className={styles.form} method="post" action="/api/auth/login">
        <TextField className={styles.field} label="Email" name="email" type="email" autoComplete="email" required />
        <TextField
          className={styles.field}
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
        <Button className={styles.submit}>Sign in</Button>
      </form>
      {openSetup ? <Link href="/setup">Create the owner account</Link> : null}
    </AuthShell>
  );
}

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <Suspense fallback={<AuthShell title="Sign in">Loading.</AuthShell>}>
      <LoginForm searchParams={searchParams} />
    </Suspense>
  );
}
