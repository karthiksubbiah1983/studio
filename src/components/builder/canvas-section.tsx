
"use client";

import { useState } from "react";
import { useBuilder } from "@/hooks/use-builder";
import { Section } from "@/lib/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CanvasElement } from "./canvas-element";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { ConditionalWrapper } from "./conditional-wrapper";
import { Copy, GripVertical, Trash } from "lucide-react";


export function CanvasSection({ section }: { section: Section }) {
  const { state, dispatch } = useBuilder();
  const [isOver, setIsOver] = useState(false);
  
  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    dispatch({ type: 'SET_DRAGGED_ELEMENT', payload: { sectionId: section.id } });
  }

  const handleDragEnd = (e: React.DragEvent) => {
    e.stopPropagation();
    dispatch({ type: 'SET_DRAGGED_ELEMENT', payload: null });
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

    // Dropping a new element from sidebar
    if ('type' in draggedElement) {
        dispatch({ type: "ADD_ELEMENT", payload: { sectionId: section.id, type: draggedElement.type } });
    } else if ('element' in draggedElement) { // Moving an existing element
        // If dropping on itself or its original section with only one element, do nothing.
        if (draggedElement.sectionId === section.id && section.elements.length === 0) {
            return;
        }
        dispatch({
            type: "MOVE_ELEMENT",
            payload: {
                from: { sectionId: draggedElement.sectionId, elementId: draggedElement.element.id },
                to: { sectionId: section.id, index: section.elements.length }
            }
        });
    }
  };
  
  const isSelected = state.selectedElement?.sectionId === section.id && !state.selectedElement?.elementId;

  const handleSectionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: 'SELECT_ELEMENT', payload: { sectionId: section.id, elementId: "" } });
  }
  
  const isElementBeingDragged = state.draggedElement && ('type' in state.draggedElement || 'element' in state.draggedElement);

  const content = (
    <div className="flex flex-col gap-4 min-h-[100px] droppable"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
    >
      {section.elements.length > 0 ? (
        <div
          className="grid gap-4 grid-cols-1"
        >
          {section.elements.map((element, index) => (
            <CanvasElement key={element.id} element={element} sectionId={section.id} index={index}/>
          ))}
        </div>
      ) : (
        <div className={cn("flex-1 border-dashed border-2 flex items-center justify-center text-muted-foreground min-h-[100px] p-4", isOver && isElementBeingDragged ? 'border-primary bg-accent/20' : 'bg-transparent')}>
          <p>Drop elements here</p>
        </div>
      )}
    </div>
  );

  const sectionContent = () => {
    return (
        <Card className={cn(isSelected && "shadow-[inset_0_0_0_1px_#084D8E]", isOver && isElementBeingDragged && "shadow-[inset_0_0_0_1px_#084D8E40]", "overflow-visible group/section relative")} onClick={handleSectionClick}>
            <div 
              draggable 
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              className="absolute top-1/2 -translate-y-1/2 -left-8 h-full flex items-center cursor-grab opacity-0 group-hover/section:opacity-100 transition-opacity"
            >
                <GripVertical className="h-6 w-6 text-muted-foreground" />
            </div>
            <Accordion type="single" collapsible defaultValue="item-1" className="w-full">
                <AccordionItem value="item-1" className="border-b-0">
                    <CardHeader className="p-2 flex flex-row items-center justify-between">
                        <AccordionTrigger className="flex-1 hover:no-underline font-medium text-base p-2">
                           {section.title}
                        </AccordionTrigger>
                         <div className="flex gap-2 opacity-0 group-hover/section:opacity-100 transition-opacity">
                           <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                  e.stopPropagation();
                                  dispatch({ type: "CLONE_SECTION", payload: { sectionId: section.id } });
                              }}
                            >
                              <Copy className="h-4 w-4" />
                          </Button>
                           <Button
                              variant="destructive"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                  e.stopPropagation();
                                  dispatch({ type: "DELETE_SECTION", payload: { sectionId: section.id } });
                              }}
                            >
                              <Trash className="h-4 w-4" />
                          </Button>
                         </div>
                    </CardHeader>
                    <AccordionContent>
                      <CardContent className="p-4 pt-0">
                        {content}
                      </CardContent>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </Card>
    );
  }

  return (
    <ConditionalWrapper logic={section.conditionalLogic}>
      {sectionContent()}
    </ConditionalWrapper>
  )
}
