
"use client";

import { useBuilder } from "@/hooks/use-builder";
import { ElementType } from "@/lib/types";
import { LucideIcon } from "lucide-react";

type Props = {
  element: {
    type: ElementType;
    icon: LucideIcon;
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
      className="flex flex-col items-center justify-center p-2 rounded-lg cursor-grab bg-card hover:border-primary border border-border transition-all duration-200 hover:shadow-md"
    >
      <Icon className="h-8 w-8 text-primary" />
      <p className="text-xs mt-2 text-center text-foreground">{label}</p>
    </div>
  );
}
