import { redirect } from "next/navigation";

export default async function FoodRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/ingredients/${id}`);
  return null;
}
