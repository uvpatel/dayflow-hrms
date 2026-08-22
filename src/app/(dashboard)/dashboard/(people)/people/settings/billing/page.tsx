import { redirect } from "next/navigation";

/** Historical settings URL retained for existing bookmarks. */
export default function BillingSettingsPage() {
  redirect("/dashboard/people/billing");
}
