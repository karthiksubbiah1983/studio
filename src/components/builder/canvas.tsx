
"use client";

import { useState } from "react";
import { useBuilder } from "@/hooks/use-builder";
import { Button } from "@/components/ui/button";
import { CanvasSection } from "./canvas-section";
import { Eye, LayoutTemplate, Plus, Save, Send, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
import { PreviewDialog } from "./preview-dialog";
import { SaveVersionDialog } from "./save-version-dialog";

export function Canvas() {
  const { state, sections, dispatch, activeForm } = useBuilder();
  const [isOver, setIsOver] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSaveOpen, setIsSaveOpen] = useState(false);
  const [saveType, setSaveType] = useState<"draft" | "published">("draft");
  const isMobile = useIsMobile();

  const handleSaveClick = (type: "draft" | "published") => {
    setSaveType(type);
    setIsSaveOpen(true);
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (state.draggedElement) {
      setIsOver(true);
    }
  };

  const handleDragLeave = () => {
    setIsOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(false);
    
    const { draggedElement } = state;
    if (!draggedElement) return;

    // Dropping a new section when the canvas is empty
    if ('type' in draggedElement && sections.length === 0) {
      dispatch({ type: "ADD_SECTION" });
    }
    
    // Dropping an existing section
    if ('sectionId' in draggedElement && !('element' in draggedElement)) {
        const fromIndex = sections.findIndex(s => s.id === draggedElement.sectionId);
        const toIndex = sections.length;
        if (fromIndex !== -1) {
            dispatch({ type: "MOVE_SECTION", payload: { fromIndex, toIndex } });
        }
    }
  };

  const handleSectionDrop = (e: React.DragEvent, targetSectionId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const { draggedElement } = state;
    if (!draggedElement || !('sectionId' in draggedElement) || ('element' in draggedElement)) return;

    const fromIndex = sections.findIndex(s => s.id === draggedElement.sectionId);
    let toIndex = sections.findIndex(s => s.id === targetSectionId);

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const isTopHalf = e.clientY - rect.top < rect.height / 2;

    if (!isTopHalf) {
        toIndex += 1;
    }
    
    if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
        dispatch({ type: "MOVE_SECTION", payload: { fromIndex, toIndex: fromIndex < toIndex ? toIndex -1 : toIndex } });
    }
  };

  const isDraggingSection = state.draggedElement && 'sectionId' in state.draggedElement && !('element' in state.draggedElement);

  const latestVersion = activeForm?.versions[0];
  const isPublished = latestVersion?.type === 'published';

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

  return (
    <>
        <header className="sticky top-0 z-10 flex items-center justify-between py-1.5 px-4 bg-[#A2C0DC] border-b shadow-sm">
            <div className="flex items-center gap-2 flex-grow min-w-0">
                <h1 className="text-lg font-semibold">
                    {activeForm?.title || ""}
                </h1>
                 {renderBadge()}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
                <Button variant="outline" size="sm" onClick={() => setIsPreviewOpen(true)}>
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                </Button>
                 <Button variant="outline" size="sm" onClick={() => handleSaveClick("draft")}>
                    <Save className="mr-2 h-4 w-4" />
                    Save Draft
                </Button>
                <Button size="sm" onClick={() => handleSaveClick("published")}>
                    <Send className="mr-2 h-4 w-4" />
                    Publish
                </Button>
            </div>
        </header>

        <div
            className="max-w-4xl mx-auto flex flex-col gap-4 pt-8 pb-24 px-4"
        >
            {sections.map((section) => (
                <div 
                    key={section.id} 
                    className="relative"
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={(e) => handleSectionDrop(e, section.id)}
                >
                    {isDraggingSection && state.draggedElement?.sectionId !== section.id && (
                        <>
                            <div className="absolute top-[-16px] left-0 w-full h-1 bg-primary rounded-full z-10 opacity-0 droppable-indicator-top" />
                            <div className="absolute bottom-[-16px] left-0 w-full h-1 bg-primary rounded-full z-10 opacity-0 droppable-indicator-bottom" />
                        </>
                    )}
                    <CanvasSection section={section} />
                </div>
            ))}
            <Button
            variant="outline"
            className="w-full py-6 border-dashed"
            onClick={() => dispatch({ type: "ADD_SECTION" })}
            >
            <Plus className="mr-2 h-4 w-4" />
            Add Section
            </Button>
        </div>

        <PreviewDialog isOpen={isPreviewOpen} onOpenChange={setIsPreviewOpen} />
        <SaveVersionDialog 
            isOpen={isSaveOpen}
            onOpenChange={setIsSaveOpen}
            saveType={saveType}
        />

        <style jsx>{`
            .relative:hover .droppable-indicator-top {
                opacity: 1;
            }
             .relative:hover .droppable-indicator-bottom {
                opacity: 1;
            }
        `}</style>
    </>
  );
}
