
"use client";

import { usePathname, useRouter } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { Sidebar, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useBuilder } from "@/hooks/use-builder";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { activeForm } = useBuilder();
  const { user, isLoading } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const isBuilderPage = pathname.startsWith('/builder');
  const isLoginPage = pathname === '/login';
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  useEffect(() => {
    if (!isClient || isLoading) return;

    if (!user && !isLoginPage) {
      router.replace('/login');
    } else if (user && isLoginPage) {
      router.replace('/');
    }
  }, [user, isLoading, isLoginPage, router, pathname, isClient]);
  

  if (!isClient || isLoading || (!user && !isLoginPage)) {
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
  } else if (pathname === '/sites') {
    title = 'Manage Sites';
    description = 'Add, edit, or delete sites where tasks can be assigned.';
  } else if (pathname === '/my-tasks') {
    title = 'My Assigned Tasks';
    description = 'View and complete tasks that have been assigned to you.';
  } else if (pathname.startsWith('/my-tasks/')) {
    title = 'Fill Form';
    description = 'Complete the required fields and submit the form.';
  } else if (pathname === '/all-tasks') {
    title = 'All Tasks';
    description = 'View and track all assigned and submitted tasks across all sites.';
  } else if (pathname === '/task-history') {
    title = 'Task History';
    description = 'View a chronological history of all task assignments and submissions.';
  } else if (pathname === '/checklists') {
    title = 'Checklist Management';
    description = 'Manage the central repository of checklist categories and questions.';
  } else if (pathname === '/task-types') {
    title = 'Task Type Configurations';
    description = 'Configure which checklist items are active for different types of tasks.';
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
