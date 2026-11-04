import Link from "next/link";
import { Suspense } from "react";
import { headers } from "next/headers";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { ErrorText, AuthShell } from "@/app/auth/shell";
import styles from "@/app/auth/auth.module.css";
import { findOpenInvite, getCurrentUser } from "@/src/lib/auth";
import { errorMessage } from "@/src/lib/http";

export const metadata = {
  title: "Invite",
};

function firstCode(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function InviteForm({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  if (!user.isOwner) {
    redirect("/");
  }

  const params = await searchParams;
  const message = errorMessage(firstCode(params.error));
  const token = firstCode(params.token);
  const invite = token ? await findOpenInvite(token) : null;
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const proto = headerList.get("x-forwarded-proto") ?? "http";
  const inviteUrl =
    invite && token && host
      ? `${proto}://${host}/invite/${encodeURIComponent(token)}`
      : null;

  return (
    <AuthShell title="Invite someone">
      <p className={styles.note}>
        Create a link for one email address. The link works for 7 days.
      </p>
      <ErrorText message={message} />
      {inviteUrl && invite ? (
        <p className={styles.link}>
          Open this address to set a password for {invite.email}. Do not use
          the sign-in page yet.{" "}
          <Link href={inviteUrl}>{inviteUrl}</Link>
        </p>
      ) : null}
      <form className={styles.form} method="post" action="/api/auth/invite">
        <label className={styles.field}>
          Email
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <button className={`button button--primary ${styles.submit}`} type="submit">
          Create invite link
        </button>
      </form>
      <Link href="/">Back</Link>
    </AuthShell>
  );
}

export default function InvitePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<AuthShell title="Invite someone">Loading.</AuthShell>}>
      <InviteForm searchParams={searchParams} />
    </Suspense>
  );
}
