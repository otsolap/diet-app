import { getCurrentUser } from "@/src/lib/auth";
import { foodId } from "@/src/lib/food-search";
import { isSameOrigin, readForm, redirectTo } from "@/src/lib/http";
import {
  createPortion,
  portionGrams,
  portionId,
  portionName,
  removePortion,
  updatePortion,
} from "@/src/lib/portions";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return redirectTo(request, "/login?error=origin");
  }

  const user = await getCurrentUser();
  if (!user) {
    return redirectTo(request, "/login?error=signedout");
  }

  const field = await readForm(request);
  if (field("intent") === "remove") {
    const id = portionId(field("portionId"));
    if (id) {
      const result = await removePortion(user.id, id);
      if (result === "used") {
        return redirectTo(request, "/saved-ingredients?error=used");
      }
    }

    return redirectTo(request, "/saved-ingredients");
  }

  if (field("intent") === "update") {
    const id = portionId(field("portionId"));
    const name = portionName(field("name"));
    const grams = portionGrams(field("grams"));
    if (!id || name === null || grams === null) {
      return redirectTo(request, id ? `/portions/${id}?error=values` : "/saved-ingredients");
    }

    const updated = await updatePortion(user.id, id, name, grams);
    if (!updated) {
      return redirectTo(request, "/saved-ingredients");
    }

    return redirectTo(request, `/portions/${id}`);
  }

  const id = foodId(field("foodId"));
  const name = portionName(field("name"));
  const grams = portionGrams(field("grams"));
  if (id === null || name === null || grams === null) {
    return redirectTo(request, id === null ? "/ingredients" : `/ingredients/${id}`);
  }

  const portion = await createPortion(user.id, id, name, grams);
  if (portion === null) {
    return redirectTo(request, "/ingredients");
  }

  return redirectTo(request, `/portions/${portion}`);
}
