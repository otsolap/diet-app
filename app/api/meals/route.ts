import { redirectTo, requireFormUser } from "@/src/lib/http";
import {
  addMealItem,
  changeMealQuantity,
  createMeal,
  mealId,
  mealItemRef,
  mealName,
  removeMeal,
  removeMealItem,
  renameMeal,
} from "@/src/lib/meals";

export async function POST(request: Request) {
  const gate = await requireFormUser(request);
  if (!gate.ok) {
    return gate.response;
  }

  const { user, field } = gate;
  const intent = field("intent");
  const id = mealId(field("mealId"));

  if (intent === "create") {
    const name = mealName(field("name"));
    if (!name) {
      return redirectTo(request, "/meals");
    }

    const created = await createMeal(user.id, name);
    return redirectTo(request, `/meals/${created}`);
  }

  if (!id) {
    return redirectTo(request, "/meals");
  }

  const back = `/meals/${id}`;

  if (intent === "rename") {
    const name = mealName(field("name"));
    if (name) {
      await renameMeal(user.id, id, name);
    }

    return redirectTo(request, back);
  }

  if (intent === "delete") {
    await removeMeal(user.id, id);
    return redirectTo(request, "/meals");
  }

  if (intent === "add") {
    const item = mealItemRef(field("item"));
    if (item) {
      await addMealItem(user.id, id, item);
    }

    return redirectTo(request, back);
  }

  if (intent === "remove-item") {
    const itemId = mealId(field("itemId"));
    if (itemId) {
      await removeMealItem(user.id, id, itemId);
    }

    return redirectTo(request, back);
  }

  if (intent === "quantity") {
    const itemId = mealId(field("itemId"));
    if (itemId) {
      await changeMealQuantity(user.id, id, itemId, field("direction"), field("quantity"));
    }

    return redirectTo(request, back);
  }

  return redirectTo(request, back);
}
