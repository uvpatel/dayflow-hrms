import { redirect } from "next/navigation";

export default function DepartmentsPage() {
  redirect("/dashboard/organization?tab=departments");
}
