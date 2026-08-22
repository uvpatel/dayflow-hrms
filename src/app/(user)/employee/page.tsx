import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth-context";
import { EmployeeDashboardClient } from "./employee-client";

export const metadata = {
  title: "Employee Workspace | Dayflow HRMS",
  description: "Personal workday pulse, time-off requests, attendance logs, and payroll records.",
};

export default async function EmployeePage() {
  const context = await getAuthContext(await headers());

  if (!context) {
    redirect("/sign-in");
  }

  return <EmployeeDashboardClient userRole={context.role} />;
}
