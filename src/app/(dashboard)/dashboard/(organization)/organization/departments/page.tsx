import { redirect } from "next/navigation";

export default function OrganizationDepartmentsPage() {
  redirect("/dashboard/organization?tab=departments");
}
