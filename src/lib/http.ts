import { NextResponse } from "next/server";

const messages: Record<string, string> = {
  invalid: "Email or password is wrong.",
  mismatch: "Passwords do not match.",
  weak: "Use at least 12 characters.",
  email: "Enter a valid email address.",
  closed: "An owner account already exists. Sign in.",
  forbidden: "That email cannot create the owner account.",
  config: "Set AUTH_BOOTSTRAP_EMAIL before you create the owner account.",
  secret: "Set AUTH_SECRET to a long random value.",
  invite: "This invite link is not valid.",
  taken: "An account with this email already exists.",
  origin: "The form was sent from another site.",
  auth: "Sign in to invite someone.",
  owner: "Only the owner can invite someone.",
  signedout: "Sign in to continue.",
};

export function errorMessage(code: string | undefined) {
  if (!code) {
    return null;
  }

  return messages[code] ?? null;
}

export function unauthorized() {
  return Response.json({ error: messages.signedout }, { status: 401 });
}

export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!origin || !host) {
    return false;
  }

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export function redirectTo(request: Request, path: string) {
  return NextResponse.redirect(new URL(path, request.url), 303);
}

export async function readForm(request: Request) {
  const form = await request.formData();

  return (name: string) => {
    const value = form.get(name);
    return typeof value === "string" ? value : "";
  };
}
