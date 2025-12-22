
"use client";

import { usePathname, useRouter } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { Sidebar, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useBuilder } from "@/hooks/use-builder";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { FormPreview } from "./form-preview";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { activeForm, tasks, state } = useBuilder();
  const { user, isLoading } = useAuth();
  const isBuilderPage = pathname.startsWith('/builder');
  const isLoginPage = pathname === '/login';
  const isMyTasksPage = pathname.startsWith('/my-tasks/');

  useEffect(() => {
    // Dynamically import and run the polyfill only on the client-side
    // after the component has mounted to prevent hydration errors.
    import('@/lib/dnd-touch-polyfill');
  }, []);
  
  useEffect(() => {
    if (isLoading) return;

    if (!user && !isLoginPage) {
      router.replace('/login');
    } else if (user && isLoginPage) {
      router.replace('/');
    }
  }, [user, isLoading, isLoginPage, router, pathname]);
  
  if (isMyTasksPage) {
      const taskId = pathname.split('/')[2];
      const task = tasks.find(t => t.id === taskId);
      if (!task) {
          return <div>Task not found</div>
      }
      const form = state.forms.find(f => f.id === task.formId);
      const version = form?.versions.find(v => v.id === task.versionId);
      if (!form || !version) {
          return <div>Form or version not found</div>;
      }
      return <FormPreview sections={version.sections} showSubmitButton={true} taskId={taskId} />;
  }

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
  } else if (pathname === '/sites') {
    title = 'Manage Sites';
    description = 'Add, edit, or delete sites where tasks can be assigned.';
  } else if (pathname === '/my-tasks') {
    title = 'My Assigned Tasks';
    description = 'View and complete tasks that have been assigned to you.';
  } else if (pathname === '/all-tasks') {
    title = 'All Tasks';
    description = 'View and track all assigned and submitted tasks across all sites.';
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
