import { foodId } from "@/src/lib/food-search";
import { redirectTo, requireFormUser } from "@/src/lib/http";
import {
  createPortion,
  portionGrams,
  portionId,
  portionName,
  removePortion,
  updatePortion,
} from "@/src/lib/portions";

export async function POST(request: Request) {
  const gate = await requireFormUser(request);
  if (!gate.ok) {
    return gate.response;
  }

  const { user, field } = gate;
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
