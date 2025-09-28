
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
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function AppSidebar() {
  const pathname = usePathname();

  const menuItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "#", label: "Tasks", icon: ListTodo },
    { href: "#", label: "Forward View", icon: History },
    { href: "#", label: "Task Scheduler", icon: CalendarCheck },
    { href: "#", label: "Accident Report", icon: FileWarning },
    { href: "#", label: "Community", icon: Users },
  ];

  return (
    <SidebarContent className="bg-card p-5">
      <SidebarMenu>
        {menuItems.map((item) => (
          <SidebarMenuItem key={item.label}>
            <Link href={item.href} legacyBehavior passHref>
              <SidebarMenuButton
                isActive={pathname === item.href}
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

    