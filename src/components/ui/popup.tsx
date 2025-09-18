"use client";

import * as React from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import { Button } from "./button";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type PopupProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  icon?: React.ElementType;
  iconColor?: string;
  className?: string;
};

export function Popup({
  isOpen,
  onOpenChange,
  title,
  description,
  icon: Icon,
  iconColor,
  className,
}: PopupProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className={cn("p-0", className)}>
        <div className="p-6">
          <AlertDialogHeader className="relative">
            {Icon && (
              <div className="mb-4">
                <Icon
                  className="h-10 w-10"
                  style={{ color: iconColor }}
                  aria-hidden="true"
                />
              </div>
            )}
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>
        </div>
        <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 h-7 w-7"
        >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
        </Button>
      </AlertDialogContent>
    </AlertDialog>
  );
}
