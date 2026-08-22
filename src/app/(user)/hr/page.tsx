import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth-context";
import { HRDashboardClient } from "./hr-client";

export const metadata = {
  title: "HR Operations Hub | Dayflow HRMS",
  description: "Manage workforce directory, approvals, leave requests, payroll, and organizational operations.",
};

export default async function HRPage() {
  const context = await getAuthContext(await headers());

  if (!context) {
    redirect("/sign-in");
  }

  // HR page is restricted to 'hr' and 'admin' roles
  if (context.role !== "hr" && context.role !== "admin") {
    redirect("/dashboard");
  }

  return <HRDashboardClient userRole={context.role} />;
}
