
"use client";

import { useState } from "react";
import { useBuilder } from "@/hooks/use-builder";
import { Button } from "@/components/ui/button";
import { CanvasSection } from "./canvas-section";
import { Plus } from "lucide-react";

export function Canvas() {
  const { state, sections, dispatch } = useBuilder();

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

  return (
    <>
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
