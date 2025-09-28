
"use client";

import { Button } from "@/components/ui/button";
import { useBuilder } from "@/hooks/use-builder";
import { Eye, PanelLeft, Settings, Save, Send, LayoutTemplate } from "lucide-react";
import { PreviewDialog } from "./preview-dialog";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { SaveVersionDialog } from "./save-version-dialog";
import { JsonPreviewDialog } from "./json-preview-dialog";

type Props = {
  onLeftSidebarToggle?: () => void;
  onRightSidebarToggle?: () => void;
  onTemplatesSidebarToggle?: () => void;
}

export function Header({ onLeftSidebarToggle, onRightSidebarToggle, onTemplatesSidebarToggle }: Props) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isJsonPreviewOpen, setIsJsonPreviewOpen] = useState(false);
  const [isSaveOpen, setIsSaveOpen] = useState(false);
  const [saveType, setSaveType] = useState<"draft" | "published">("draft");
  const isMobile = useIsMobile();

  const handleSaveClick = (type: "draft" | "published") => {
    setSaveType(type);
    setIsSaveOpen(true);
  }

  return (
    <>
      <header className="relative z-10 flex items-center justify-between py-1.5 px-2 bg-gray-50 shadow">
        <div className="flex items-center gap-2 flex-grow min-w-0">
            {isMobile && (
                <Button variant="ghost" size="icon" onClick={onLeftSidebarToggle}>
                    <PanelLeft className="h-5 w-5"/>
                </Button>
            )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button variant="outline" size="xs" onClick={() => setIsPreviewOpen(true)}>
            <Eye className="h-4 w-4" />
            Preview
          </Button>
          {!isMobile && (
            <>
              <Button variant="outline" size="xs" onClick={() => handleSaveClick("draft")}>
                <Save className="h-4 w-4" />
                Save Draft
              </Button>
               <Button size="xs" onClick={() => handleSaveClick("published")}>
                <Send className="h-4 w-4" />
                Publish
              </Button>
            </>
          )}
           {isMobile && (
             <Button variant="ghost" size="icon" onClick={onTemplatesSidebarToggle}>
                  <LayoutTemplate className="h-5 w-5"/>
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
      <JsonPreviewDialog isOpen={isJsonPreviewOpen} onOpenChange={setIsJsonPreviewOpen} />
      <SaveVersionDialog 
        isOpen={isSaveOpen}
        onOpenChange={setIsSaveOpen}
        saveType={saveType}
      />
    </>
  );
}
