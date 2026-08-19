import { AppSidebar } from "@/components/sidebar/sidebar"
import {
  SidebarInset,
  SidebarProvider,

} from "@/components/ui/sidebar"

export default function PlatformLayout({
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