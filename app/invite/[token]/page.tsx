import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { ErrorText, AuthShell } from "@/app/auth/shell";
import styles from "@/app/auth/auth.module.css";
import { primaryButtonClass } from "@/src/components/button/button";
import { findOpenInvite } from "@/src/lib/auth";
import { errorMessage } from "@/src/lib/http";

export const metadata = {
  title: "Accept invite",
};

function firstCode(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function AcceptForm({
  token,
  searchParams,
}: {
  token: string;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const invite = await findOpenInvite(token);
  const params = await searchParams;
  const message = errorMessage(firstCode(params.error));

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
    </AuthShell>
  );
}

export default function AcceptInvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<AuthShell title="Create your account">Loading.</AuthShell>}>
      <AcceptInviteLoader params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function AcceptInviteLoader({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { token } = await params;
  return <AcceptForm token={token} searchParams={searchParams} />;
}
