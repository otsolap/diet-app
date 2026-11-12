import { getCurrentUser } from "@/src/lib/auth";
import { foodId } from "@/src/lib/food-search";
import { isSameOrigin, readForm, redirectTo } from "@/src/lib/http";
import { removeIngredient, saveIngredient } from "@/src/lib/ingredients";

function safeReturn(value: string) {
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return null;
  }

  const path = value.split("?")[0]?.split("#")[0] ?? "";
  if (path.split("/").includes("..")) {
    return null;
  }

  if (path === "/ingredients" || path.startsWith("/ingredients/") || path === "/saved-ingredients") {
    return value;
  }

  return null;
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return redirectTo(request, "/login?error=origin");
  }

  const user = await getCurrentUser();
  if (!user) {
    return redirectTo(request, "/login?error=signedout");
  }

  const field = await readForm(request);
  const id = foodId(field("foodId"));
  if (field("intent") === "remove") {
    if (id !== null) {
      await removeIngredient(user.id, id);
    }

    return redirectTo(request, "/saved-ingredients");
  }

  if (id === null) {
    return redirectTo(request, "/ingredients");
  }

  await saveIngredient(user.id, id);
  return redirectTo(request, safeReturn(field("next")) ?? `/ingredients/${id}`);
}
