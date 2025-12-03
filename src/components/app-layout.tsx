
"use client";

import { usePathname, useRouter } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { Sidebar, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useBuilder } from "@/hooks/use-builder";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { activeForm } = useBuilder();
  const { user, isLoading } = useAuth();
  const isBuilderPage = pathname.startsWith('/builder');
  const isLoginPage = pathname === '/login';

  useEffect(() => {
    if (isLoading) return;

    if (!user && !isLoginPage) {
      router.replace('/login');
    } else if (user && isLoginPage) {
      router.replace('/');
    }
  }, [user, isLoading, isLoginPage, router, pathname]);

  if (isLoading || (!user && !isLoginPage)) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (isLoginPage) {
    return <>{children}</>;
  }

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
