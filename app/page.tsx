import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/src/lib/auth";

async function HomeDestination() {
  await connection();
  let user = null;

  try {
    user = await getCurrentUser();
  } catch {
    user = null;
  }

  redirect(user ? "/saved" : "/login");
}

export default function Home() {
  return (
    <Suspense fallback={<p>Loading.</p>}>
      <HomeDestination />
    </Suspense>
  );
}
