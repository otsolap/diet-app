import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { headers } from "next/headers";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { ErrorText, AuthShell } from "@/app/auth/shell";
import styles from "@/app/auth/auth.module.css";
import { Button } from "@/src/components/button/button";
import { TextField } from "@/src/components/form/text-field";
import { findOpenInvite, requireUser } from "@/src/lib/auth";
import { errorMessage } from "@/src/lib/http";
import { firstQueryValue } from "@/src/lib/query";

export const metadata: Metadata = {
  title: "Invite",
};

async function InviteForm({
  searchParams,
}: Pick<PageProps<"/invite">, "searchParams">) {
  await connection();
  const user = await requireUser();

  if (!user.isOwner) {
    redirect("/");
  }

  const params = await searchParams;
  const message = errorMessage(firstQueryValue(params.error));
  const token = firstQueryValue(params.token);
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
        <TextField className={styles.field} label="Email" name="email" type="email" autoComplete="email" required />
        <Button className={styles.submit}>Create invite link</Button>
      </form>
      <Link href="/">Back</Link>
    </AuthShell>
  );
}

export default function InvitePage({ searchParams }: PageProps<"/invite">) {
  return (
    <Suspense fallback={<AuthShell title="Invite someone">Loading.</AuthShell>}>
      <InviteForm searchParams={searchParams} />
    </Suspense>
  );
}
