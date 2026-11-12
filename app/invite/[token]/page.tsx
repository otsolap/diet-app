import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { ErrorText, AuthShell } from "@/app/auth/shell";
import styles from "@/app/auth/auth.module.css";
import { Button } from "@/src/components/button/button";
import { TextField } from "@/src/components/form/text-field";
import { findOpenInvite } from "@/src/lib/auth";
import { errorMessage } from "@/src/lib/http";
import { firstQueryValue } from "@/src/lib/query";

export const metadata: Metadata = {
  title: "Accept invite",
};

async function AcceptForm({
  token,
  searchParams,
}: {
  token: string;
  searchParams: PageProps<"/invite/[token]">["searchParams"];
}) {
  await connection();
  const invite = await findOpenInvite(token);
  const params = await searchParams;
  const message = errorMessage(firstQueryValue(params.error));

  if (!invite) {
    return (
      <AuthShell title="Invite link">
        <ErrorText message={message ?? "This invite link is not valid."} />
        <Link href="/login">Sign in</Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Create your account">
      <p className={styles.note}>This invite is for {invite.email}.</p>
      <ErrorText message={message} />
      <form className={styles.form} method="post" action="/api/auth/accept">
        <input type="hidden" name="token" value={token} />
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
    </AuthShell>
  );
}

export default function AcceptInvitePage({
  params,
  searchParams,
}: PageProps<"/invite/[token]">) {
  return (
    <Suspense fallback={<AuthShell title="Create your account">Loading.</AuthShell>}>
      <AcceptInviteLoader params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function AcceptInviteLoader({
  params,
  searchParams,
}: PageProps<"/invite/[token]">) {
  const { token } = await params;
  return <AcceptForm token={token} searchParams={searchParams} />;
}
