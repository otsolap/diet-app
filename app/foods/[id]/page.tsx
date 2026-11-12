import { Suspense } from "react";
import { redirect } from "next/navigation";

async function FoodRedirect({ params }: Pick<PageProps<"/foods/[id]">, "params">) {
  const { id } = await params;
  redirect(`/ingredients/${id}`);
  return null;
}

export default function FoodRedirectPage({ params }: PageProps<"/foods/[id]">) {
  return (
    <Suspense fallback={<p>Loading.</p>}>
      <FoodRedirect params={params} />
    </Suspense>
  );
}
