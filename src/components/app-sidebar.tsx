
"use client";

import {
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import {
  Home,
  ListTodo,
  History,
  CalendarCheck,
  FileWarning,
  Users,
  Tags,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  const pathname = usePathname();

  const menuItems = [
    { href: "/", label: "Manage Templates", icon: Home },
    { href: "/categories", label: "Categories", icon: Tags },
    { href: "#", label: "Tasks", icon: ListTodo },
    { href: "#", label: "Forward View", icon: History },
    { href: "#", label: "Task Scheduler", icon: CalendarCheck },
    { href: "#", label: "Accident Report", icon: FileWarning },
    { href: "#", label: "Community", icon: Users },
  ];

  return (
    <SidebarContent>
      <SidebarMenu>
        {menuItems.map((item) => (
          <SidebarMenuItem key={item.label}>
            <Link href={item.href} legacyBehavior passHref>
              <SidebarMenuButton
                className={cn(
                  "px-5 py-2",
                  pathname === item.href &&
                    item.href === "/" &&
                    "sidebar-active-link"
                )}
                isActive={pathname === item.href && item.href !== "/"}
                tooltip={item.label}
              >
                <item.icon />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarContent>
  );
}
