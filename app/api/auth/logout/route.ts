import { clearSession, readSessionToken, signOut } from "@/src/lib/auth";
import { isSameOrigin, redirectTo } from "@/src/lib/http";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return redirectTo(request, "/?error=origin");
  }

  await signOut(await readSessionToken());
  return clearSession(redirectTo(request, "/"));
}
