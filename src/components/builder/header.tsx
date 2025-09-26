
"use client";

import { Button } from "@/components/ui/button";
import { useBuilder } from "@/hooks/use-builder";
import { Eye, PanelLeft, Settings, History, Save, Send } from "lucide-react";
import { PreviewDialog } from "./preview-dialog";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { SaveVersionDialog } from "./save-version-dialog";
import { JsonPreviewDialog } from "./json-preview-dialog";
import { Badge } from "../ui/badge";
import { cn } from "@/lib/utils";

type Props = {
  onLeftSidebarToggle?: () => void;
  onRightSidebarToggle?: () => void;
  onHistorySidebarToggle?: () => void;
}

export function Header({ onLeftSidebarToggle, onRightSidebarToggle, onHistorySidebarToggle }: Props) {
  const { activeForm, dispatch } = useBuilder();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isJsonPreviewOpen, setIsJsonPreviewOpen] = useState(false);
  const [isSaveOpen, setIsSaveOpen] = useState(false);
  const [saveType, setSaveType] = useState<"draft" | "published">("draft");
  const isMobile = useIsMobile();

  const handleSaveClick = (type: "draft" | "published") => {
    setSaveType(type);
    setIsSaveOpen(true);
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (activeForm) {
      dispatch({ type: 'UPDATE_FORM_TITLE', payload: { formId: activeForm.id, title: e.target.value } });
    }
  }
  
  const latestVersion = activeForm?.versions[0];
  const publishedVersionCount = activeForm?.versions.filter(v => v.type === 'published').length || 0;

  const renderBadge = () => {
    if (!latestVersion) return null;

    if (latestVersion.type === 'published') {
        return <Badge variant="default">Published v{publishedVersionCount}</Badge>
    }
    return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">Draft</Badge>
  }

  return (
    <>
      <header className="flex items-center justify-between p-2 bg-gray-50 shadow-sm">
        <div className="flex items-center gap-2 flex-grow min-w-0">
            {isMobile && (
                <Button variant="ghost" size="icon" onClick={onLeftSidebarToggle}>
                    <PanelLeft className="h-5 w-5"/>
                </Button>
            )}
            <div className="flex flex-col flex-grow min-w-0">
                <input 
                  type="text"
                  value={activeForm?.title || "Untitled Form"}
                  onChange={handleTitleChange}
                  className="font-bold text-xl bg-transparent border-none focus:ring-0 focus:border-b focus:border-primary rounded-md px-2 w-full min-w-0"
                />
                <div className="ml-2">
                    {renderBadge()}
                </div>
            </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
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
      <JsonPreviewDialog isOpen={isJsonPreviewOpen} onOpenChange={setIsJsonPreviewOpen} />
      <SaveVersionDialog 
        isOpen={isSaveOpen}
        onOpenChange={setIsSaveOpen}
        saveType={saveType}
      />
    </>
  );
}
