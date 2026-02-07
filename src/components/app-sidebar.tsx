
"use client";

import {
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  ClipboardList,
  Table,
  Settings,
  Users,
  Folder,
  Building,
  ListTodo,
  FileClock,
  Megaphone,
  Mail,
  Cog,
  Link as LinkIcon,
  ChevronDown,
  ClipboardCheck,
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
  isHeader?: boolean;
};

const menuItems: MenuItem[] = [
  { href: "#", label: "Dashboard", icon: LayoutDashboard },
  { href: "/all-tasks", label: "All Task", icon: ClipboardList },
  { href: "#", label: "Site Overview", icon: Table },
  {
    href: "#",
    label: "Administration",
    icon: Settings,
    isHeader: true,
    children: [
        { href: "/sites", label: "Site Management", icon: Building, children: [
          { href: "/", label: "Manage Templates", icon: Folder },
          { href: "/categories", label: "Categories", icon: Folder },
          { href: "/checklists", label: "Checklists", icon: ClipboardCheck },
        ] },
        { href: "#", label: "User Management", icon: Users, children: [] },
        { href: "#", label: "Task Management", icon: ListTodo, children: [] },
        { href: "/task-history", label: "Task History", icon: FileClock },
        { href: "#", label: "Announcement", icon: Megaphone },
        { href: "#", label: "Mail Setup", icon: Mail },
        { href: "#", label: "Configurations", icon: Cog },
    ],
  },
];

const quickLinks: MenuItem[] = [
    { href: "#", label: "Future Task", icon: LinkIcon, isHeader: true},
    { href: "#", label: "Accident Report", icon: LinkIcon },
    { href: "#", label: "Incident Report", icon: LinkIcon },
    { href: "#", label: "Co Pilot Admin", icon: LinkIcon },
    { href: "#", label: "Daily Handover", icon: LinkIcon },
    { href: "#", label: "Housekeeping Request", icon: LinkIcon },
    { href: "#", label: "Compliance Report", icon: LinkIcon },
    { href: "#", label: "PI Service Quality Assurance", icon: LinkIcon },
    { href: "#", label: "Food Traceability", icon: LinkIcon },
];

const SidebarMenuEntry = ({ item, level = 1 }: { item: MenuItem, level?: number }) => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(item.isHeader);
  const hasChildren = item.children && item.children.length > 0;
  
  const checkActive = (item: MenuItem): boolean => {
    if (item.href === pathname && item.href !== '#') return true;
    if (item.children) {
      return item.children.some(child => checkActive(child));
    }
    return false;
  }
  
  const isActive = checkActive(item);

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
  const isActuallyActive = (pathname === item.href && item.href !== '#');

  return (
    <SidebarMenuItem>
      <Link href={item.href} onClick={handleToggle} className="w-full">
        <SidebarMenuButton
          className={cn(
            currentLevelStyle.button,
            item.isHeader && "font-bold",
            isActuallyActive ? currentLevelStyle.active : currentLevelStyle.inactive,
            (isActive && !isActuallyActive && level === 1) && "bg-primary/10 text-primary"
          )}
          isActive={isActuallyActive}
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
        <SidebarMenuSub className={cn("flex flex-col", level === 1 && "bg-blue-50/50")}>
            {item.children?.map((child) => (
                <SidebarMenuEntry key={child.label} item={child} level={level + 1} />
            ))}
        </SidebarMenuSub>
      )}
    </SidebarMenuItem>
  );
};


const QuickLinkEntry = ({ item }: { item: MenuItem }) => {
    const pathname = usePathname();
    const isActuallyActive = (pathname === item.href && item.href !== '#');

    if (item.isHeader) {
        return (
            <div className="px-5 py-3 text-sm font-bold text-primary flex items-center gap-2">
                <LinkIcon className="h-4 w-4" />
                {item.label}
            </div>
        )
    }

    return (
        <SidebarMenuItem>
            <Link href={item.href} className="w-full">
                <SidebarMenuButton
                    className={cn(
                        "py-2 px-5 text-sm",
                        isActuallyActive ? "level-2-active font-semibold" : "hover:bg-blue-100 text-muted-foreground",
                    )}
                    isActive={isActuallyActive}
                    tooltip={item.label}
                >
                    <div className="flex items-center justify-between w-full">
                        <span>{item.label}</span>
                    </div>
                </SidebarMenuButton>
            </Link>
            {item.label === 'Accident Report' && <SidebarSeparator className="my-1" />}
        </SidebarMenuItem>
    )
}

export function AppSidebar() {
  return (
    <SidebarContent>
      <SidebarMenu>
        {menuItems.map((item) => (
          <SidebarMenuEntry key={item.label} item={item} />
        ))}
      </SidebarMenu>
      <SidebarSeparator />
      <SidebarMenu>
          {quickLinks.map((item) => (
              <QuickLinkEntry key={item.label} item={item} />
          ))}
      </SidebarMenu>
    </SidebarContent>
  );
}
