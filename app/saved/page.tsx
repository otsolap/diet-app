import { redirect } from "next/navigation";

export default function SavedRedirect() {
  redirect("/saved-ingredients");
  return null;
}
