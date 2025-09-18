"use client";

import { useBuilder } from "@/hooks/use-builder";
import { ElementType } from "@/lib/types";

type Props = {
  element: {
    type: ElementType;
    icon: React.ElementType;
    label: string;
  };
};

export function SidebarElement({ element }: Props) {
  const { dispatch } = useBuilder();
  const { icon: Icon, label, type } = element;

  const handleDragStart = (e: React.DragEvent) => {
    dispatch({ type: "SET_DRAGGED_ELEMENT", payload: { type } });
    e.dataTransfer.setData("text/plain", type);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={() => dispatch({ type: "SET_DRAGGED_ELEMENT", payload: null })}
      className="flex flex-col items-center justify-center p-2 border rounded-lg cursor-grab bg-card hover:bg-accent/10 hover:border-primary transition-all duration-200 shadow-sm"
    >
      <Icon className="h-8 w-8 text-primary" />
      <p className="text-xs mt-2 text-center text-foreground">{label}</p>
    </div>
  );
}
