
"use client";

import {
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Home,
  ListTodo,
  History,
  CalendarCheck,
  FileWarning,
  Users,
  Tags,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SidebarMenuButton } from "./ui/sidebar";
import React, { useState } from "react";

type MenuItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  children?: MenuItem[];
};

const menuItems: MenuItem[] = [
  { href: "/", label: "Manage Templates", icon: Home },
  { href: "/categories", label: "Categories", icon: Tags },
  {
    href: "#",
    label: "Tasks",
    icon: ListTodo,
    children: [
      {
        href: "#",
        label: "Sub Task 1",
        icon: ListTodo,
        children: [
          { href: "#", label: "Sub-Sub Task 1", icon: ListTodo },
          { href: "#", label: "Sub-Sub Task 2", icon: ListTodo },
        ],
      },
      { href: "#", label: "Sub Task 2", icon: ListTodo },
    ],
  },
  { href: "#", label: "Forward View", icon: History },
  { href: "#", label: "Task Scheduler", icon: CalendarCheck },
  { href: "#", label: "Accident Report", icon: FileWarning },
  { href: "#", label: "Community", icon: Users },
];

const SidebarMenuEntry = ({ item, level = 1 }: { item: MenuItem, level?: number }) => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const isActive = pathname === item.href;
  const hasChildren = item.children && item.children.length > 0;

  const handleToggle = (e: React.MouseEvent) => {
    if (hasChildren) {
      e.preventDefault();
      setIsOpen(!isOpen);
    }
  };

  const levelClasses = {
    1: {
      button: "py-3 px-5",
      active: "level-1-active hover:bg-primary/90",
      inactive: "hover:bg-accent",
    },
    2: {
      button: "py-2 px-5",
      active: "level-2-active font-semibold",
      inactive: "hover:bg-blue-100",
      bg: "level-2-bg",
    },
    3: {
      button: "py-2 pl-10 pr-5",
      active: "level-3-active font-semibold",
      inactive: "hover:bg-blue-100",
      bg: "level-3-bg",
    },
  } as const;

  const currentLevelStyle = levelClasses[level as keyof typeof levelClasses] || levelClasses[1];

  return (
    <SidebarMenuItem>
      <Link href={item.href} onClick={handleToggle} className="w-full">
        <SidebarMenuButton
          className={cn(
            currentLevelStyle.button,
            isActive ? currentLevelStyle.active : currentLevelStyle.inactive
          )}
          isActive={isActive}
          tooltip={item.label}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
            </div>
            {hasChildren && (
                <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
            )}
          </div>
        </SidebarMenuButton>
      </Link>
      {hasChildren && isOpen && (
        <div className={cn("flex flex-col", currentLevelStyle.bg)}>
            {item.children?.map((child) => (
                <SidebarMenuEntry key={child.label} item={child} level={level + 1} />
            ))}
        </div>
      )}
    </SidebarMenuItem>
  );
};

export function AppSidebar() {
  return (
    <SidebarContent>
      <SidebarMenu>
        {menuItems.map((item) => (
          <SidebarMenuEntry key={item.label} item={item} />
        ))}
      </SidebarMenu>
    </SidebarContent>
  );
}
