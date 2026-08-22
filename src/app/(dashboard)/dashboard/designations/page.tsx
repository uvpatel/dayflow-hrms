import { redirect } from "next/navigation";

export default function DesignationsPage() {
  redirect("/dashboard/organization?tab=designations");
}
