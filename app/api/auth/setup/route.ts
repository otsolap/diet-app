import {
  attachSession,
  countUsers,
  createOwner,
  hasSecret,
  isValidEmail,
  normalizeEmail,
  passwordProblem,
} from "@/src/lib/auth";
import { isSameOrigin, readForm, redirectTo } from "@/src/lib/http";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return redirectTo(request, "/setup?error=origin");
  }

  if (!hasSecret()) {
    return redirectTo(request, "/setup?error=secret");
  }

  if ((await countUsers()) > 0) {
    return redirectTo(request, "/login?error=closed");
  }

  const field = await readForm(request);
  const email = normalizeEmail(field("email"));
  const password = field("password");
  const confirm = field("confirm");

  if (!isValidEmail(email)) {
    return redirectTo(request, "/setup?error=email");
  }

  if (password !== confirm) {
    return redirectTo(request, "/setup?error=mismatch");
  }

  if (passwordProblem(password)) {
    return redirectTo(request, "/setup?error=weak");
  }

  const result = await createOwner(email, password);
  if ("error" in result) {
    return redirectTo(request, `/setup?error=${result.error}`);
  }

  return attachSession(redirectTo(request, "/"), result.token);
}
