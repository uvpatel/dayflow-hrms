import { redirect } from "next/navigation";

/** Compatibility route for old bookmarks; `/sign-up` is canonical. */
export default function LegacySignupPage() {
  redirect("/sign-up");
}
