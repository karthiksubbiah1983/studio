
"use client";

import { useBuilder } from "@/hooks/use-builder";
import { ElementType } from "@/lib/types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";

type Props = {
  element: {
    type: ElementType;
    icon: IconDefinition;
    label: string;
  };
};

export function SidebarElement({ element }: Props) {
  const { dispatch } = useBuilder();
  const { icon, label, type } = element;

  const handleDragStart = (e: React.DragEvent) => {
    dispatch({ type: "SET_DRAGGED_ELEMENT", payload: { type } });
    e.dataTransfer.setData("text/plain", type);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={() => dispatch({ type: "SET_DRAGGED_ELEMENT", payload: null })}
      className="flex flex-col items-center justify-center p-2 rounded-lg cursor-grab bg-card hover:border-primary border border-transparent transition-all duration-200 shadow-sm"
    >
      <FontAwesomeIcon icon={icon} className="h-8 w-8 text-primary" />
      <p className="text-xs mt-2 text-center text-foreground">{label}</p>
    </div>
  );
}
