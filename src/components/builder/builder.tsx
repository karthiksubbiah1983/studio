
"use client";

import { Header } from "./header";
import { ElementsSidebar } from "./elements-sidebar";
import { PropertiesSidebar } from "./properties-sidebar";
import { Canvas } from "./canvas";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";

export function Builder() {
  const isMobile = useIsMobile();
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);

  if (isMobile) {
    return (
      <div className="flex flex-col w-full h-full">
        <Header 
          onLeftSidebarToggle={() => setIsLeftSidebarOpen(prev => !prev)}
          onRightSidebarToggle={() => setIsRightSidebarOpen(prev => !prev)}
        />
        <div className="flex-grow h-full overflow-y-auto bg-background">
          <Canvas />
        </div>
        <Sheet open={isLeftSidebarOpen} onOpenChange={setIsLeftSidebarOpen}>
            <SheetContent side="left" className="p-0">
                <ElementsSidebar />
            </SheetContent>
        </Sheet>
         <Sheet open={isRightSidebarOpen} onOpenChange={setIsRightSidebarOpen}>
            <SheetContent side="right" className="p-0">
                <PropertiesSidebar />
            </SheetContent>
        </Sheet>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full">
      <Header />
      <div className="flex flex-grow h-full overflow-hidden">
        <ElementsSidebar />
        <div className="flex-grow h-full overflow-y-auto bg-background">
          <Canvas />
        </div>
        <PropertiesSidebar />
      </div>
    </div>
  );
}
