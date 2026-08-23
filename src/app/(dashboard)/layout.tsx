import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requirePageAuthContext } from "@/lib/auth/page";
import { AppSidebar } from "@/components/sidebar/sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/main/site-header";
import { canAccessPage } from "@/lib/permissions";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const requestHeaders = await headers();
  const context = await requirePageAuthContext(requestHeaders);

  const pathname = requestHeaders.get("x-dayflow-pathname") ?? "/dashboard";
  if (!canAccessPage(context.role, pathname)) {
    redirect("/dashboard");
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="flex flex-col min-h-screen">
          <SiteHeader />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
