import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requirePageAuthContext } from "@/lib/auth/page";
import { HRDashboardClient } from "./hr-client";

export const metadata = {
  title: "HR Operations Hub | Dayflow HRMS",
  description: "Manage workforce directory, approvals, leave requests, payroll, and organizational operations.",
};

export default async function HRPage() {
  const context = await requirePageAuthContext(await headers());

  // HR page is restricted to 'hr' and 'admin' roles
  if (context.role !== "hr" && context.role !== "admin") {
    redirect("/dashboard");
  }

  return <HRDashboardClient userRole={context.role} />;
}
