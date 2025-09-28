
"use client";

import { Header } from "./header";
import { ElementsSidebar } from "./elements-sidebar";
import { PropertiesSidebar } from "./properties-sidebar";
import { Canvas } from "./canvas";
import { useIsMobile } from "@/hooks/use-mobile";
import { useEffect, useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { TemplatesSidebar } from "./templates-sidebar";
import { RightSidebar } from "./right-sidebar";

export function Builder() {
  const isMobileView = useIsMobile();
  const [isClient, setIsClient] = useState(false);
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [isTemplatesSidebarOpen, setIsTemplatesSidebarOpen] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
    // Dynamically import the polyfill only on the client side.
    import("@/lib/dnd-touch-polyfill");
  }, []);

  const isMobile = isClient && isMobileView;

  if (!isClient) {
    // Render a consistent, non-interactive structure on the server
    return (
       <div className="flex flex-col w-full h-full">
        <Header 
            onLeftSidebarToggle={() => {}}
            onRightSidebarToggle={() => {}}
            onTemplatesSidebarToggle={() => {}}
        />
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
        onTemplatesSidebarToggle={() => setIsTemplatesSidebarOpen(prev => !prev)}
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
            <Sheet open={isTemplatesSidebarOpen} onOpenChange={setIsTemplatesSidebarOpen}>
                <SheetContent side="right" className="p-0 w-full max-w-md">
                    <TemplatesSidebar />
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
