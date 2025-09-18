"use client";

import { useState } from "react";
import { FormElementInstance } from "@/lib/types";
import { ElementPreview } from "./element-preview";
import { useBuilder } from "@/hooks/use-builder";
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConditionalWrapper } from "./conditional-wrapper";

type Props = {
  element: FormElementInstance;
  sectionId: string;
  index: number;
};

export function CanvasElement({ element, sectionId, index }: Props) {
  const { state, dispatch } = useBuilder();
  const [mouseIsOver, setMouseIsOver] = useState(false);
  const [isTopHalf, setIsTopHalf] = useState(false);
  const isSelected = state.selectedElement?.elementId === element.id;

  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    dispatch({ type: "SET_DRAGGED_ELEMENT", payload: { element, sectionId } });
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.stopPropagation();
    dispatch({ type: "SET_DRAGGED_ELEMENT", payload: null });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const mouseY = e.clientY - e.currentTarget.getBoundingClientRect().top;
    setIsTopHalf(mouseY < e.currentTarget.clientHeight / 2);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const { draggedElement } = state;
    if (!draggedElement) return;

    let targetIndex = index;
    if (isTopHalf) {
        targetIndex = index;
    } else {
        targetIndex = index + 1;
    }
    
    // Dropping a new element from sidebar
    if ('type' in draggedElement) {
        dispatch({ type: "ADD_ELEMENT", payload: { sectionId, type: draggedElement.type, index: targetIndex } });
    } else if ('element' in draggedElement && draggedElement.element.id !== element.id) {
        // Moving an existing element
        dispatch({
            type: "MOVE_ELEMENT",
            payload: {
                from: { sectionId: draggedElement.sectionId, elementId: draggedElement.element.id },
                to: { sectionId, index: targetIndex }
            }
        });
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: "SELECT_ELEMENT", payload: { elementId: element.id, sectionId } });
  };

  return (
    <ConditionalWrapper logic={element.conditionalLogic}>
      <div
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onMouseEnter={() => setMouseIsOver(true)}
        onMouseLeave={() => setMouseIsOver(false)}
        onClick={handleClick}
        className={cn(
          "relative flex flex-col p-4 rounded-lg cursor-pointer bg-card border border-transparent transition-all",
          mouseIsOver && "border-primary/50",
          isSelected && "border-primary ring-2 ring-primary"
        )}
      >
        {mouseIsOver && state.draggedElement && isTopHalf && <div className="absolute top-0 left-0 w-full h-1 bg-primary rounded-full z-10" />}
        {mouseIsOver && state.draggedElement && !isTopHalf && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-full z-10" />}

        {mouseIsOver && (
          <div className="absolute top-2 right-2 flex gap-2 z-10">
            <Button
              variant="destructive"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                dispatch({ type: "DELETE_ELEMENT", payload: { elementId: element.id, sectionId } });
              }}
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        )}
        <ElementPreview element={element} />
      </div>
    </ConditionalWrapper>
  );
}
