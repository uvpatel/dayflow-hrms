import { headers } from "next/headers";
import { requirePageAuthContext } from "@/lib/auth/page";
import { EmployeeDashboardClient } from "./employee-client";

export const metadata = {
  title: "Employee Workspace | Dayflow HRMS",
  description: "Personal workday pulse, time-off requests, attendance logs, and payroll records.",
};

export default async function EmployeePage() {
  const context = await requirePageAuthContext(await headers());

  return <EmployeeDashboardClient userRole={context.role} />;
}
