
"use client";

import { Header } from "./header";
import { ElementsSidebar } from "./elements-sidebar";
import { PropertiesSidebar } from "./properties-sidebar";
import { Canvas } from "./canvas";
import { useIsMobile } from "@/hooks/use-mobile";
import { useEffect, useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import "@/lib/dnd-touch-polyfill";
import { HistorySidebar } from "./history-sidebar";
import { RightSidebar } from "./right-sidebar";

export function Builder() {
  const isMobileView = useIsMobile();
  const [isClient, setIsClient] = useState(false);
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [isHistorySidebarOpen, setIsHistorySidebarOpen] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  const isMobile = isClient && isMobileView;

  if (!isClient) {
    // Render a consistent, non-interactive structure on the server
    return (
       <div className="flex flex-col w-full h-full">
        <Header />
        <div className="flex flex-grow h-full overflow-hidden gap-2.5">
          <ElementsSidebar />
          <div className="flex-grow h-full overflow-y-auto bg-background">
            <Canvas />
          </div>
          <RightSidebar />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full">
      <Header 
        onLeftSidebarToggle={() => setIsLeftSidebarOpen(prev => !prev)}
        onRightSidebarToggle={() => setIsRightSidebarOpen(prev => !prev)}
        onHistorySidebarToggle={() => setIsHistorySidebarOpen(prev => !prev)}
      />
      <div className="flex flex-grow h-full overflow-hidden gap-2.5">
        {isMobile ? (
          <Sheet open={isLeftSidebarOpen} onOpenChange={setIsLeftSidebarOpen}>
            <SheetContent side="left" className="p-0">
                <ElementsSidebar />
            </SheetContent>
          </Sheet>
        ) : (
          <ElementsSidebar />
        )}
        
        <div className="flex-grow h-full overflow-y-auto bg-background">
          <Canvas />
        </div>
        
        {isMobile ? (
          <>
            <Sheet open={isRightSidebarOpen} onOpenChange={setIsRightSidebarOpen}>
                <SheetContent side="right" className="p-0">
                    <PropertiesSidebar />
                </SheetContent>
            </Sheet>
            <Sheet open={isHistorySidebarOpen} onOpenChange={setIsHistorySidebarOpen}>
                <SheetContent side="right" className="p-0 w-full max-w-md">
                    <HistorySidebar />
                </SheetContent>
            </Sheet>
          </>
        ) : (
          <RightSidebar />
        )}
      </div>
    </div>
  );
}
