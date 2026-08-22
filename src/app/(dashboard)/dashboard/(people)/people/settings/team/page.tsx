import { redirect } from "next/navigation";

/**
 * Historical settings URL retained for existing bookmarks. The live team
 * workspace owns the data fetches and row-level access checks.
 */
export default function TeamSettingsPage() {
  redirect("/dashboard/my-team");
}
