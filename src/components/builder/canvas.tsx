"use client";

import { useState } from "react";
import { useBuilder } from "@/hooks/use-builder";
import { Button } from "@/components/ui/button";
import { CanvasSection } from "./canvas-section";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function Canvas() {
  const { state, dispatch } = useBuilder();
  const [isOver, setIsOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(true);
  };

  const handleDragLeave = () => {
    setIsOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(false);
    
    const { draggedElement } = state;
    if (!draggedElement) return;

    // This drop is for adding a new section when the canvas is empty
    if ('type' in draggedElement) {
        if (state.sections.length === 0) {
            dispatch({ type: "ADD_SECTION" });
        }
    }
  };

  return (
    <div
      className={cn(
        "flex-grow p-4 md:p-8 lg:p-12 h-full w-full mx-auto",
        isOver && "bg-accent/10"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="max-w-4xl mx-auto flex flex-col gap-8">
        {state.sections.map((section) => (
          <CanvasSection key={section.id} section={section} />
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
    </div>
  );
}
