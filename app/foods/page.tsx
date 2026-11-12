import { redirect } from "next/navigation";

export default function FoodsRedirect() {
  redirect("/ingredients");
  return null;
}
