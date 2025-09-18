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
import { Trash } from "lucide-react";
import { Button } from "../ui/button";

export function CanvasSection({ section }: { section: Section }) {
  const { state, dispatch } = useBuilder();
  const [isOver, setIsOver] = useState(false);

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
        return;
    }

    // Moving an existing element
    if ('element' in draggedElement) {
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

  const content = (
    <div className="flex flex-col gap-4 p-4 min-h-[100px] droppable"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
    >
      {section.elements.length > 0 ? (
        <div
          className={cn(
            "grid gap-4",
            `grid-cols-1 md:grid-cols-${state.columns}`
          )}
        >
          {section.elements.map((element, index) => (
            <CanvasElement key={element.id} element={element} sectionId={section.id} index={index}/>
          ))}
        </div>
      ) : (
        <div className={cn("flex-1 rounded-lg border-dashed border-2 flex items-center justify-center text-muted-foreground", isOver ? 'border-primary bg-accent/20' : 'bg-transparent')}>
          <p>Drop elements here</p>
        </div>
      )}
    </div>
  );

  if (section.config === 'normal') {
    return (
        <Card className={cn(isSelected && "ring-2 ring-primary", "overflow-visible")} onClick={handleSectionClick}>
            <Accordion type="single" collapsible defaultValue="item-1">
                <AccordionItem value="item-1" className="border-b-0">
                    <CardHeader className="p-4">
                        <AccordionTrigger className="flex justify-between items-center text-lg font-medium hover:no-underline">
                           {section.title}
                        </AccordionTrigger>
                    </CardHeader>
                    <AccordionContent>
                        <CardContent className="p-0">{content}</CardContent>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </Card>
    );
  }

  return (
    <Card className={cn(isSelected && "ring-2 ring-primary")} onClick={handleSectionClick}>
      <CardHeader className="flex flex-row items-center justify-between p-4">
        <h3 className="text-lg font-medium">{section.title}</h3>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}
