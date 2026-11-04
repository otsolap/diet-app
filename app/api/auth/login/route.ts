import {
  attachSession,
  hasSecret,
  isValidEmail,
  normalizeEmail,
  passwordProblem,
  signIn,
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
  const email = normalizeEmail(field("email"));
  const password = field("password");

  if (!isValidEmail(email) || passwordProblem(password)) {
    return redirectTo(request, "/login?error=invalid");
  }

  const token = await signIn(email, password);
  if (!token) {
    return redirectTo(request, "/login?error=invalid");
  }

  return attachSession(redirectTo(request, "/"), token);
}
