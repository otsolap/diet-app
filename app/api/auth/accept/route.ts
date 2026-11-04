import {
  acceptInvite,
  attachSession,
  hasSecret,
  passwordProblem,
} from "@/src/lib/auth";
import { isSameOrigin, readForm, redirectTo } from "@/src/lib/http";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return redirectTo(request, "/login?error=origin");
  }

  if (!hasSecret()) {
    return redirectTo(request, "/login?error=secret");
  }

  const field = await readForm(request);
  const token = field("token");
  const password = field("password");
  const confirm = field("confirm");
  const back = `/invite/${encodeURIComponent(token)}`;

  if (!token) {
    return redirectTo(request, "/login?error=invite");
  }

  if (password !== confirm) {
    return redirectTo(request, `${back}?error=mismatch`);
  }

  if (passwordProblem(password)) {
    return redirectTo(request, `${back}?error=weak`);
  }

  const result = await acceptInvite(token, password);
  if ("error" in result) {
    return redirectTo(request, `${back}?error=${result.error}`);
  }

  return attachSession(redirectTo(request, "/"), result.token);
}
