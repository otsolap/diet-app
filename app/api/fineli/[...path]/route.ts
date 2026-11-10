import { getCurrentUser } from "@/src/lib/auth";
import { fetchFineli, fineliTarget } from "@/src/lib/fineli";
import { unauthorized } from "@/src/lib/http";

export async function GET(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  if (!(await getCurrentUser())) {
    return unauthorized();
  }

  const { path } = await context.params;
  const target = fineliTarget(path, new URL(request.url).searchParams);
  if (!target.ok) {
    return Response.json({ error: target.error }, { status: target.status });
  }

  return fetchFineli(target.url);
}
