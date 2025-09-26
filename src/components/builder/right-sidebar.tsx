
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PropertiesSidebar } from "./properties-sidebar";
import { HistorySidebar } from "./history-sidebar";
import { History, Settings } from "lucide-react";

export function RightSidebar() {
  return (
    <aside className="w-80 bg-card flex flex-col">
      <Tabs defaultValue="properties" className="w-full flex-grow flex flex-col">
        <TabsList className="w-full rounded-none">
          <TabsTrigger value="properties" className="flex-1 gap-2">
            <Settings className="h-4 w-4" />
            Properties
          </TabsTrigger>
          <TabsTrigger value="history" className="flex-1 gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>
        <TabsContent value="properties" className="flex-grow h-0">
          <PropertiesSidebar />
        </TabsContent>
        <TabsContent value="history" className="flex-grow h-0">
          <HistorySidebar />
        </TabsContent>
      </Tabs>
    </aside>
  );
}
