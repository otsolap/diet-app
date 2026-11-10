import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextResponse } from "next/server";
import { query, withTransaction } from "@/src/lib/db";
import { hashPassword, verifyPassword } from "@/src/lib/passwords";
import { SESSION_COOKIE } from "@/src/lib/session-cookie";
const SESSION_DAYS = 30;
const INVITE_DAYS = 7;
const MIN_PASSWORD_LENGTH = 12;
const MAX_PASSWORD_LENGTH = 200;

type UserRow = {
  id: string;
  email: string;
};

export type CurrentUser = UserRow & {
  isOwner: boolean;
};

let dummyPasswordHash: Promise<string> | null = null;

function dummyHash() {
  dummyPasswordHash ??= hashPassword(randomBytes(32).toString("base64url"));
  return dummyPasswordHash;
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 320;
}

export function passwordProblem(password: string) {
  if (password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
    return "weak";
  }

  if (password.includes("\0")) {
    return "weak";
  }

  return null;
}

export function hasSecret() {
  const secret = process.env.AUTH_SECRET;
  return Boolean(secret && secret.length >= 16);
}

function requireSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("AUTH_SECRET is not set");
  }

  return secret;
}

function hashToken(token: string) {
  return createHmac("sha256", requireSecret()).update(token).digest("base64url");
}

function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

function newToken() {
  return randomBytes(32).toString("base64url");
}

function sessionCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export function attachSession(response: NextResponse, token: string) {
  response.cookies.set(
    SESSION_COOKIE,
    token,
    sessionCookieOptions(60 * 60 * 24 * SESSION_DAYS),
  );
  return response;
}

export function clearSession(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", sessionCookieOptions(0));
  return response;
}

async function createSession(userId: string) {
  const token = newToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await query(
    `INSERT INTO sessions (token_hash, user_id, expires_at)
     VALUES ($1, $2, $3)`,
    [hashToken(token), userId, expiresAt],
  );

  return token;
}

export async function countUsers() {
  const result = await query<{ count: string }>("SELECT count(*)::text AS count FROM users");
  return Number(result.rows[0]?.count ?? 0);
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?error=signedout");
  }

  return user;
}

export async function getCurrentUser() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }

  const result = await query<UserRow & { is_owner: boolean }>(
    `SELECT users.id, users.email, users.is_owner
     FROM sessions
     JOIN users ON users.id = sessions.user_id
     WHERE sessions.token_hash = $1
       AND sessions.expires_at > now()`,
    [hashToken(token)],
  );
  const user = result.rows[0];
  if (!user) {
    return null;
  }

  return { id: user.id, email: user.email, isOwner: user.is_owner };
}

export async function readSessionToken() {
  const jar = await cookies();
  return jar.get(SESSION_COOKIE)?.value ?? null;
}

export async function signIn(email: string, password: string) {
  const result = await query<UserRow & { password_hash: string }>(
    "SELECT id, email, password_hash FROM users WHERE email = $1",
    [email],
  );
  const user = result.rows[0];
  const stored = user?.password_hash ?? (await dummyHash());
  const match = await verifyPassword(password, stored);

  if (!user || !match) {
    return null;
  }

  return createSession(user.id);
}

export async function signOut(token: string | null) {
  if (!token) {
    return;
  }

  await query("DELETE FROM sessions WHERE token_hash = $1", [hashToken(token)]);
}

export function bootstrapEmail() {
  const email = process.env.AUTH_BOOTSTRAP_EMAIL;
  if (!email) {
    return null;
  }

  const normalized = normalizeEmail(email);
  return isValidEmail(normalized) ? normalized : null;
}

function sameEmail(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export async function createOwner(email: string, password: string) {
  const allowed = bootstrapEmail();
  if (!allowed) {
    return { error: "config" as const };
  }

  if ((await countUsers()) > 0) {
    return { error: "closed" as const };
  }

  if (!sameEmail(email, allowed)) {
    return { error: "forbidden" as const };
  }

  const userId = crypto.randomUUID();
  const passwordHash = await hashPassword(password);

  try {
    await query(
      `INSERT INTO users (id, email, password_hash, is_owner)
       VALUES ($1, $2, $3, true)`,
      [userId, email, passwordHash],
    );
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { error: "closed" as const };
    }

    throw error;
  }

  return { token: await createSession(userId) };
}

export async function createInvite(email: string, user: CurrentUser) {
  if (!user.isOwner) {
    return { error: "owner" as const };
  }

  const existing = await query<{ id: string }>("SELECT id FROM users WHERE email = $1", [email]);
  if (existing.rows[0]) {
    return { error: "taken" as const };
  }

  const token = newToken();
  const expiresAt = new Date(Date.now() + INVITE_DAYS * 24 * 60 * 60 * 1000);

  await query(
    `INSERT INTO invites (id, email, token_hash, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [crypto.randomUUID(), email, hashToken(token), expiresAt],
  );

  return { token };
}

type InviteRow = {
  id: string;
  email: string;
};

export async function findOpenInvite(token: string) {
  const result = await query<InviteRow>(
    `SELECT id, email
     FROM invites
     WHERE token_hash = $1
       AND accepted_at IS NULL
       AND expires_at > now()`,
    [hashToken(token)],
  );

  return result.rows[0] ?? null;
}

export async function acceptInvite(token: string, password: string) {
  const passwordHash = await hashPassword(password);

  return withTransaction(async (queryInTransaction) => {
    const invite = await queryInTransaction<InviteRow>(
      `SELECT id, email
       FROM invites
       WHERE token_hash = $1
         AND accepted_at IS NULL
         AND expires_at > now()
       FOR UPDATE`,
      [hashToken(token)],
    );
    const row = invite.rows[0];
    if (!row) {
      return { error: "invite" as const };
    }

    const userId = crypto.randomUUID();

    try {
      await queryInTransaction(
        `INSERT INTO users (id, email, password_hash)
         VALUES ($1, $2, $3)`,
        [userId, row.email, passwordHash],
      );
    } catch (error) {
      if (isUniqueViolation(error)) {
        return { error: "taken" as const };
      }

      throw error;
    }

    await queryInTransaction(
      "UPDATE invites SET accepted_at = now() WHERE id = $1",
      [row.id],
    );

    const sessionToken = newToken();
    const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
    await queryInTransaction(
      `INSERT INTO sessions (token_hash, user_id, expires_at)
       VALUES ($1, $2, $3)`,
      [hashToken(sessionToken), userId, expiresAt],
    );

    return { token: sessionToken };
  });
}
