import { redirect } from "next/navigation";

// No marketing/home page exists yet (out of scope for this feature — see
// specs/002-authjs-authorization). Redirect to the one thing that does.
export default function RootPage() {
  redirect("/login");
}
