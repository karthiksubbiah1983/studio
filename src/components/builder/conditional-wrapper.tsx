"use client";

import { useBuilder } from "@/hooks/use-builder";
import { ConditionalLogic } from "@/lib/types";
import { Eye, EyeOff } from "lucide-react";
import { Badge } from "../ui/badge";
import { cn } from "@/lib/utils";

type Props = {
  logic: ConditionalLogic | undefined;
  children: React.ReactNode;
};

export function ConditionalWrapper({ logic, children }: Props) {
  if (!logic || !logic.enabled || !logic.triggerElementId || !logic.showWhenValue) {
    return <>{children}</>;
  }

  return (
    <div className="relative group/conditional">
      <div className="absolute top-[-10px] left-2 z-10">
        <Badge variant="secondary" className="border-primary/50 border">
          <Eye className="h-3 w-3 mr-1" />
          Conditional
        </Badge>
      </div>
      <div className={cn("opacity-70 group-hover/conditional:opacity-100 transition-opacity")}>
        {children}
      </div>
    </div>
  );
}
