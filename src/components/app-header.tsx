
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

export function AppHeader() {
  return (
    <header
      className="flex items-center justify-between px-6 bg-primary text-primary-foreground border-b border-primary/90"
      style={{ height: "64px" }}
    >
      <div className="flex items-center gap-4">
        {/* You can add a logo or app title here */}
        <h1 className="text-xl font-bold">CoPilot</h1>
      </div>
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          className="flex flex-col h-auto p-1 hover:bg-primary/90"
        >
          <PlusCircle className="h-5 w-5" />
          <span className="text-xs">Task</span>
        </Button>
        <Button variant="ghost" size="icon" className="relative hover:bg-primary/90">
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
