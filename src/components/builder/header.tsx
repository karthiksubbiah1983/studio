
"use client";

import { Button } from "@/components/ui/button";
import { useBuilder } from "@/hooks/use-builder";
import { Eye, PanelLeft, Settings, History, Save, Send } from "lucide-react";
import { PreviewDialog } from "./preview-dialog";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { SaveVersionDialog } from "./save-version-dialog";

type Props = {
  onLeftSidebarToggle?: () => void;
  onRightSidebarToggle?: () => void;
  onHistorySidebarToggle?: () => void;
}

export function Header({ onLeftSidebarToggle, onRightSidebarToggle, onHistorySidebarToggle }: Props) {
  const { state } = useBuilder();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSaveOpen, setIsSaveOpen] = useState(false);
  const [saveType, setSaveType] = useState<"draft" | "published">("draft");
  const isMobile = useIsMobile();

  const handleSaveClick = (type: "draft" | "published") => {
    setSaveType(type);
    setIsSaveOpen(true);
  }

  return (
    <>
      <header className="flex items-center justify-between p-2 bg-card shadow-sm">
        <div className="flex items-center gap-2">
            {isMobile && (
                <Button variant="ghost" size="icon" onClick={onLeftSidebarToggle}>
                    <PanelLeft className="h-5 w-5"/>
                </Button>
            )}
            <h1 className="text-xl font-bold text-primary font-headline">FormForge</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsPreviewOpen(true)}>
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
          {!isMobile && (
            <>
              <Button variant="outline" size="sm" onClick={() => handleSaveClick("draft")}>
                <Save className="mr-2 h-4 w-4" />
                Save Draft
              </Button>
               <Button size="sm" onClick={() => handleSaveClick("published")}>
                <Send className="mr-2 h-4 w-4" />
                Publish
              </Button>
            </>
          )}
           {isMobile && (
             <Button variant="ghost" size="icon" onClick={onHistorySidebarToggle}>
                  <History className="h-5 w-5"/>
              </Button>
           )}
           {isMobile && (
                <Button variant="ghost" size="icon" onClick={onRightSidebarToggle}>
                    <Settings className="h-5 w-5"/>
                </Button>
            )}
        </div>
      </header>
      <PreviewDialog isOpen={isPreviewOpen} onOpenChange={setIsPreviewOpen} />
      <SaveVersionDialog 
        isOpen={isSaveOpen}
        onOpenChange={setIsSaveOpen}
        saveType={saveType}
      />
    </>
  );
}
