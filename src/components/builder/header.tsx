
"use client";

import { Button } from "@/components/ui/button";
import { PanelLeft, Settings, LayoutTemplate } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useEffect, useState } from "react";

type Props = {
  onLeftSidebarToggle?: () => void;
  onRightSidebarToggle?: () => void;
  onTemplatesSidebarToggle?: () => void;
}

export function Header({ onLeftSidebarToggle, onRightSidebarToggle, onTemplatesSidebarToggle }: Props) {
  const isMobileView = useIsMobile();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const isMobile = isClient && isMobileView;

  if (!isMobile) {
    return null;
  }

  return (
    <header className="relative z-10 flex items-center justify-between py-1.5 px-2 bg-gray-50 shadow">
      <div className="flex items-center gap-2 flex-grow min-w-0">
          <Button variant="ghost" size="icon" onClick={onLeftSidebarToggle}>
              <PanelLeft className="h-5 w-5"/>
          </Button>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
          <Button variant="ghost" size="icon" onClick={onTemplatesSidebarToggle}>
                <LayoutTemplate className="h-5 w-5"/>
            </Button>
          <Button variant="ghost" size="icon" onClick={onRightSidebarToggle}>
              <Settings className="h-5 w-5"/>
          </Button>
      </div>
    </header>
  );
}
