
"use client";

import { useState } from "react";
import { FormElementInstance } from "@/lib/types";
import { ElementPreview } from "./element-preview";
import { useBuilder } from "@/hooks/use-builder";
import { Button } from "@/components/ui/button";
import { Copy, Trash } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConditionalWrapper } from "./conditional-wrapper";

type Props = {
  element: FormElementInstance;
  sectionId: string;
  index: number;
  isNested?: boolean;
};

export function CanvasElement({ element, sectionId, index, isNested }: Props) {
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

  const [isOverContainer, setIsOverContainer] = useState(false);

  const handleContainerDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOverContainer(false);
    const { draggedElement } = state;
    if (!draggedElement) return;

    if ('type' in draggedElement) { // Dropping new element
      dispatch({ type: 'ADD_ELEMENT', payload: { sectionId, type: draggedElement.type, parentId: element.id }})
    } else if ('element' in draggedElement) { // Moving existing element
      dispatch({ type: 'MOVE_ELEMENT', payload: {
        from: { sectionId: draggedElement.sectionId, elementId: draggedElement.element.id },
        to: { sectionId, parentId: element.id, index: element.elements?.length || 0 }
      }})
    }
  }

  const isElementBeingDragged = state.draggedElement && ('type' in state.draggedElement || 'element' in state.draggedElement);

  const findParent = (elementId: string, sections: any[]) => {
    for (const section of sections) {
      const find = (elements: FormElementInstance[]): FormElementInstance | null => {
        for (const el of elements) {
          if (el.elements?.some(child => child.id === elementId)) {
            return el;
          }
          if (el.elements) {
            const parent = find(el.elements);
            if (parent) return parent;
          }
        }
        return null;
      };
      const parent = find(section.elements);
      if (parent) return parent;
    }
    return null;
  };
  
  const parent = findParent(element.id, state.forms.find(f => f.id === state.activeFormId)?.versions[0]?.sections || []);
  const isHorizontalChild = parent?.direction === 'horizontal';

  if (element.type === 'Container') {
    const alignmentClasses = {
        justify: {
            start: 'justify-start',
            center: 'justify-center',
            end: 'justify-end',
            between: 'justify-between',
            around: 'justify-around',
            evenly: 'justify-evenly',
        },
        align: {
            start: 'items-start',
            center: 'items-center',
            end: 'items-end',
            stretch: 'items-stretch',
            baseline: 'items-baseline',
        }
    }
    return (
      <ConditionalWrapper logic={element.conditionalLogic}>
        <div
          onMouseEnter={() => setMouseIsOver(true)}
          onMouseLeave={() => setMouseIsOver(false)}
          onClick={(e) => {
            e.stopPropagation();
            dispatch({ type: "SELECT_ELEMENT", payload: { elementId: element.id, sectionId } });
          }}
          className={cn(
            "relative flex flex-col p-4 cursor-pointer bg-card transition-all",
            (mouseIsOver || isSelected) && "shadow-[inset_0_0_0_1px_#084D8E]"
          )}
        >
          {mouseIsOver && (
            <div className="absolute top-2 right-2 flex gap-2 z-10">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => {
                  e.stopPropagation();
                  dispatch({ type: "CLONE_ELEMENT", payload: { elementId: element.id, sectionId } });
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
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
           <div 
            onDragOver={(e) => {e.preventDefault(); e.stopPropagation(); if(isElementBeingDragged) setIsOverContainer(true)}}
            onDragLeave={(e) => {e.preventDefault(); e.stopPropagation(); setIsOverContainer(false)}}
            onDrop={handleContainerDrop}
            className={cn("flex-1 mt-4 min-h-[100px] border-dashed border-2 p-4",
              element.direction === 'horizontal' ? 'flex flex-row gap-2' : 'flex flex-col gap-4',
              element.justify && alignmentClasses.justify[element.justify],
              element.align && alignmentClasses.align[element.align],
              isOverContainer && isElementBeingDragged && "border-primary bg-accent/20"
            )}
           >
            {element.elements && element.elements.length > 0 ? (
                element.elements.map((childElement, idx) => (
                    <CanvasElement key={childElement.id} element={childElement} sectionId={sectionId} index={idx} isNested={true} />
                ))
            ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                    Drop elements here
                </div>
            )}
           </div>
        </div>
      </ConditionalWrapper>
    )
  }

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
        onClick={(e) => {
          e.stopPropagation();
          dispatch({ type: "SELECT_ELEMENT", payload: { elementId: element.id, sectionId } });
        }}
        className={cn(
          "relative flex flex-col p-4 cursor-pointer bg-card transition-all",
          (mouseIsOver || isSelected) && "shadow-[inset_0_0_0_1px_#084D8E]",
          isHorizontalChild && 'flex-1'
        )}
      >
        {mouseIsOver && state.draggedElement && isTopHalf && <div className="absolute top-0 left-0 w-full h-1 bg-primary z-10" />}
        {mouseIsOver && state.draggedElement && !isTopHalf && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary z-10" />}

        {mouseIsOver && (
          <div className="absolute top-2 right-2 flex gap-2 z-10">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                dispatch({ type: "CLONE_ELEMENT", payload: { elementId: element.id, sectionId } });
              }}
            >
              <Copy className="h-4 w-4" />
            </Button>
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
