import BackgroundLinesDemo from "@/components/background-lines-demo";
import FeaturesSectionDemo from "@/components/features-section-demo-1";
import { auth } from "@/lib/auth";
import { getRoleLandingPath } from "@/lib/auth/landing";
import { normalizeRole } from "@/lib/permissions";
import { db } from "@/db";
import { employees } from "@/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";


export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user) {
    const [employee] = await db
      .select({ role: employees.role })
      .from(employees)
      .where(eq(employees.userId, session.user.id))
      .limit(1);
    redirect(getRoleLandingPath(normalizeRole(employee?.role)));
  }

  return (
   <>
    <BackgroundLinesDemo />
    <FeaturesSectionDemo />
   </>
  );
}
