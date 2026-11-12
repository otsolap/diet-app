import { Suspense } from "react";
import { redirect } from "next/navigation";

async function FoodRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/ingredients/${id}`);
  return null;
}

export default function FoodRedirectPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p>Loading.</p>}>
      <FoodRedirect params={params} />
    </Suspense>
  );
}
