import { foodId } from "@/src/lib/food-search";
import { redirectTo, requireFormUser } from "@/src/lib/http";
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
  const gate = await requireFormUser(request);
  if (!gate.ok) {
    return gate.response;
  }

  const { user, field } = gate;
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
