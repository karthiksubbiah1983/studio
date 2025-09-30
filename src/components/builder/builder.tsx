
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
import { useBuilder } from "@/hooks/use-builder";
import { Button } from "../ui/button";
import { Eye, Save, Send } from "lucide-react";
import { Badge } from "../ui/badge";
import { cn } from "@/lib/utils";
import { PreviewDialog } from "./preview-dialog";
import { SaveVersionDialog } from "./save-version-dialog";

export function Builder() {
  const isMobileView = useIsMobile();
  const [isClient, setIsClient] = useState(false);
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [isTemplatesSidebarOpen, setIsTemplatesSidebarOpen] = useState(false);
  
  const { activeForm, setSections } = useBuilder();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSaveOpen, setIsSaveOpen] = useState(false);
  const [saveType, setSaveType] = useState<"draft" | "published">("draft");
  
  const [activeVersionId, setActiveVersionId] = useState<string | undefined>();

  useEffect(() => {
    if (activeForm) {
      setActiveVersionId(activeForm.versions[0]?.id);
    }
  }, [activeForm]);


  const latestVersion = activeForm?.versions[0];
  const isPublished = latestVersion?.type === 'published';

  useEffect(() => {
    // This effect synchronizes the local sections state with the global active version
    const currentActiveVersion = activeForm?.versions[0];
    if (currentActiveVersion && currentActiveVersion.id !== activeVersionId) {
      setSections(currentActiveVersion.sections);
      setActiveVersionId(currentActiveVersion.id);
    }
  }, [activeForm?.versions, activeVersionId, setSections]);


  const handleSaveClick = (type: "draft" | "published") => {
    setSaveType(type);
    setIsSaveOpen(true);
  }

  const renderBadge = () => {
    if (!latestVersion) return null;
    return (
      <Badge className={cn(
        "text-xs",
        isPublished
            ? "bg-green-100 text-green-800 border-green-200"
            : "bg-yellow-100 text-yellow-800 border-yellow-200"
      )}>
        {isPublished ? `Published` : 'Draft'}
      </Badge>
    );
  };

  useEffect(() => {
    setIsClient(true);
  }, []);

  const isMobile = isClient && isMobileView;

  const titleBar = (
     <header className="sticky top-0 z-10 flex items-center justify-between py-1.5 px-4 bg-[#A2C0DC] border-b shadow-sm">
        <div className="flex items-center gap-2 flex-grow min-w-0">
            <h1 className="text-lg font-semibold">
                {activeForm?.title || ""}
            </h1>
              {renderBadge()}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
            <Button variant="outline" size="xs" onClick={() => setIsPreviewOpen(true)}>
                <Eye className="mr-1 h-4 w-4" />
                Preview
            </Button>
              <Button variant="outline" size="xs" onClick={() => handleSaveClick("draft")}>
                <Save className="mr-1 h-4 w-4" />
                Save Draft
            </Button>
            <Button size="xs" onClick={() => handleSaveClick("published")} className="bg-green-600 hover:bg-green-700">
                <Send className="mr-1 h-4 w-4" />
                Publish
            </Button>
        </div>
    </header>
  );

  if (!isClient) {
    // Keep a consistent server render to avoid hydration issues
    return (
       <div className="flex flex-col w-full h-full">
        <Header 
            onLeftSidebarToggle={() => {}}
            onRightSidebarToggle={() => {}}
            onTemplatesSidebarToggle={() => {}}
        />
         <div className="flex-1 flex flex-row overflow-hidden">
            <ElementsSidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                {titleBar}
                <div className="flex flex-grow h-full overflow-hidden">
                    <div className="flex-grow h-full overflow-y-auto bg-background">
                        <Canvas />
                    </div>
                    <RightSidebar />
                </div>
            </div>
          </div>
        </div>
    );
  }

  return (
    <>
      <div className="flex flex-col w-full h-full">
        <Header 
          onLeftSidebarToggle={() => setIsLeftSidebarOpen(prev => !prev)}
          onRightSidebarToggle={() => setIsRightSidebarOpen(prev => !prev)}
          onTemplatesSidebarToggle={() => setIsTemplatesSidebarOpen(prev => !prev)}
        />
        <div className="flex-1 flex flex-row overflow-hidden">
            {isMobile ? (
                <Sheet open={isLeftSidebarOpen} onOpenChange={setIsLeftSidebarOpen}>
                    <SheetContent side="left" className="p-0">
                        <ElementsSidebar />
                    </SheetContent>
                </Sheet>
            ) : (
                <ElementsSidebar />
            )}

            <div className="flex-1 flex flex-col overflow-hidden">
                {titleBar}
                <div className="flex flex-grow h-[calc(100%-53px)] overflow-hidden">
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
        </div>
      </div>
      <PreviewDialog isOpen={isPreviewOpen} onOpenChange={setIsPreviewOpen} />
      <SaveVersionDialog 
          isOpen={isSaveOpen}
          onOpenChange={setIsSaveOpen}
          saveType={saveType}
      />
    </>
  );
}
