
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, PlusCircle } from "lucide-react";
import Link from "next/link";
import { SidebarTrigger } from "./ui/sidebar";

type AppHeaderProps = {
  title?: string;
  description?: string;
};

export function AppHeader({ title, description }: AppHeaderProps) {
  return (
    <header
      className="flex items-center justify-between bg-primary text-primary-foreground"
      style={{ height: "64px" }}
    >
      <div className="flex items-stretch h-full">
        <div
          className="flex items-center justify-start gap-1 pl-4 bg-card text-primary"
          style={{ width: "var(--sidebar-width)" }}
        >
          <SidebarTrigger className="h-8 w-8 text-primary hover:text-primary/90 hover:bg-accent" />
          <Link href="/" className="flex items-center gap-2 text-primary hover:text-primary/90 transition-colors">
            <h1 className="text-xl font-bold">CoPilot</h1>
          </Link>
        </div>
        <div className="flex items-center px-6">
          {title && (
            <div>
              <h2 className="text-lg font-semibold text-primary-foreground">{title}</h2>
              {description && (
                <p className="text-xs text-primary-foreground/80 max-w-2xl">
                  {description}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 px-6">
        <Button
          variant="ghost"
          className="hover:bg-primary/90"
        >
          <PlusCircle className="h-5 w-5 mr-1" />
          <span className="text-sm">Task</span>
        </Button>
        <Button variant="ghost" size="icon" className="relative hover:bg-primary/90 mr-[6px]">
          <Bell className="h-5 w-5" />
          {/* Optional: Add a badge for new notifications */}
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
          <span className="sr-only">Notifications</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-primary/90">
              <Avatar className="h-9 w-9">
                <AvatarImage src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="User Avatar" />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">User Name</p>
                <p className="text-xs leading-none text-muted-foreground">
                  user@example.com
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
