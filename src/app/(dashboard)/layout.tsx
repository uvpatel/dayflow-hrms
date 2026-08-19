import { AppSidebar } from "@/components/sidebar/sidebar"
import {
  SidebarInset,
  SidebarProvider,

} from "@/components/ui/sidebar"

export default function dashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <section>
     <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
    {children}
     </SidebarInset>
    </SidebarProvider>
    </section>;
}