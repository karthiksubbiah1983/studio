
"use client";

import { usePathname } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { Sidebar, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showSidebar = pathname === "/" || pathname === "/categories";

  return (
    <div className="flex flex-col h-screen">
      <AppHeader />
      <div className="flex flex-1 overflow-hidden">
        {showSidebar && (
          <Sidebar>
            <AppSidebar />
          </Sidebar>
        )}
        <SidebarInset>
          <main className="flex-1 overflow-auto">{children}</main>
        </SidebarInset>
      </div>
    </div>
  );
}
