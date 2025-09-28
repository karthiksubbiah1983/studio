
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PropertiesSidebar } from "./properties-sidebar";
import { TemplatesSidebar } from "./templates-sidebar";
import { LayoutTemplate, Settings } from "lucide-react";

export function RightSidebar() {
  return (
    <aside className="w-80 bg-card flex flex-col">
      <Tabs defaultValue="properties" className="w-full flex-grow flex flex-col">
        <TabsList className="w-full rounded-none">
          <TabsTrigger value="properties" className="flex-1 gap-2">
            <Settings className="h-4 w-4" />
            Properties
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex-1 gap-2">
            <LayoutTemplate className="h-4 w-4" />
            Templates
          </TabsTrigger>
        </TabsList>
        <TabsContent value="properties" className="flex-grow h-0">
          <PropertiesSidebar />
        </TabsContent>
        <TabsContent value="templates" className="flex-grow h-0">
          <TemplatesSidebar />
        </TabsContent>
      </Tabs>
    </aside>
  );
}
