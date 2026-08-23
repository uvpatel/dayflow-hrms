import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requirePageAuthContext } from "@/lib/auth/page";
import { ManagerDashboardClient } from "./manager-client";

export const metadata = {
  title: "Manager Workspace | Dayflow HRMS",
  description: "Manage direct reports, team attendance, approvals, and team time-off.",
};

export default async function ManagerPage() {
  const context = await requirePageAuthContext(await headers());

  // Manager page is accessible to 'manager', 'hr', and 'admin' roles
  if (
    context.role !== "manager" &&
    context.role !== "hr" &&
    context.role !== "admin"
  ) {
    redirect("/dashboard");
  }

  return <ManagerDashboardClient userRole={context.role} />;
}
