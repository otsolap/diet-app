import {
  createInvite,
  getCurrentUser,
  hasSecret,
  isValidEmail,
  normalizeEmail,
} from "@/src/lib/auth";
import { isSameOrigin, readForm, redirectTo } from "@/src/lib/http";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return redirectTo(request, "/invite?error=origin");
  }

  if (!hasSecret()) {
    return redirectTo(request, "/invite?error=secret");
  }

  const user = await getCurrentUser();
  if (!user) {
    return redirectTo(request, "/login?error=auth");
  }

  if (!user.isOwner) {
    return redirectTo(request, "/?error=owner");
  }

  const field = await readForm(request);
  const email = normalizeEmail(field("email"));
  if (!isValidEmail(email)) {
    return redirectTo(request, "/invite?error=email");
  }

  const result = await createInvite(email, user);
  if ("error" in result) {
    const path = result.error === "owner" ? "/?error=owner" : "/invite?error=taken";
    return redirectTo(request, path);
  }

  return redirectTo(request, `/invite?token=${encodeURIComponent(result.token)}`);
}
