import { getCurrentUser } from "@/src/lib/auth";
import { foodId } from "@/src/lib/food-search";
import { isSameOrigin, readForm, redirectTo } from "@/src/lib/http";
import {
  createPortion,
  portionGrams,
  portionId,
  portionName,
  removePortion,
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
      await removePortion(user.id, id);
    }

    return redirectTo(request, "/saved-ingredients");
  }

  const id = foodId(field("foodId"));
  const name = portionName(field("name"));
  const grams = portionGrams(field("grams"));
  if (id === null || name === null || grams === null) {
    return redirectTo(request, id === null ? "/foods" : `/foods/${id}`);
  }

  const portion = await createPortion(user.id, id, name, grams);
  if (portion === null) {
    return redirectTo(request, "/foods");
  }

  return redirectTo(request, `/portions/${portion}`);
}
