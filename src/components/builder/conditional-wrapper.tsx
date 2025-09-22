"use client";

import { useBuilder } from "@/hooks/use-builder";
import { ConditionalLogic } from "@/lib/types";
import { Eye } from "lucide-react";
import { Badge } from "../ui/badge";
import { cn } from "@/lib/utils";

type Props = {
  logic: ConditionalLogic | undefined;
  children: React.ReactNode;
};

export function ConditionalWrapper({ logic, children }: Props) {
  const { state } = useBuilder();

  if (!logic || !logic.enabled || !logic.triggerElementId || !logic.showWhenValue) {
    return <>{children}</>;
  }
  
  const triggerElement = state.sections
    .flatMap(s => s.elements)
    .find(e => e.id === logic.triggerElementId);

  return (
    <div className="relative group/conditional">
      <div className="absolute top-[-10px] left-2 z-10">
        <Badge variant="secondary" className="border-primary/50 border">
          <Eye className="h-3 w-3 mr-1" />
          Conditional: {triggerElement?.label} = {logic.showWhenValue}
        </Badge>
      </div>
      <div className={cn("opacity-70 group-hover/conditional:opacity-100 transition-opacity")}>
        {children}
      </div>
    </div>
  );
}
