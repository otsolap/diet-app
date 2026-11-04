import Link from "next/link";
import { connection } from "next/server";
import { getCurrentUser } from "@/src/lib/auth";
import { errorMessage } from "@/src/lib/http";
import styles from "./page.module.css";

export async function AuthStatus({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const params = await searchParams;
  const code = params.error;
  const message = errorMessage(Array.isArray(code) ? code[0] : code);
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className={styles.auth}>
        {message ? <p>{message}</p> : null}
        <Link href="/login">Sign in</Link>
      </div>
    );
  }

  return (
    <div className={styles.auth}>
      {message ? <p>{message}</p> : null}
      <p>{user.email}</p>
      {user.isOwner ? <Link href="/invite">Invite</Link> : null}
      <form method="post" action="/api/auth/logout">
        <button className="button button--link" type="submit">
          Sign out
        </button>
      </form>
    </div>
  );
}
