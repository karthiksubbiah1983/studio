
"use client";

import { usePathname } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { Sidebar, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useBuilder } from "@/hooks/use-builder";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { activeForm } = useBuilder();
  const isBuilderPage = pathname.startsWith('/builder');

  let title: string | undefined;
  let description: string | undefined;

  if (isBuilderPage) {
    title = activeForm?.title || 'Form Builder';
    description = "Design and configure your form using the drag-and-drop interface.";
  } else if (pathname === '/') {
    title = 'Template Management';
    description = "Create, edit, and manage all your form templates from one place.";
  } else if (pathname === '/categories') {
    title = 'Manage Categories';
    description = "Add, edit, or delete categories and their sub-categories to organize your form templates.";
  }


  return (
    <div className="flex flex-col h-screen">
      <AppHeader title={title} description={description} />
      <div className="flex flex-1 overflow-hidden">
        {!isBuilderPage && (
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
