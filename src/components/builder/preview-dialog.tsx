

"use client";

import { useMemo } from "react";
import { useBuilder } from "@/hooks/use-builder";
import { getAllElements } from "@/lib/utils";
import type { FormElementInstance } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormPreview } from "./form-preview";

type Props = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PreviewDialog({ isOpen, onOpenChange }: Props) {
  const { sections } = useBuilder();

  // The main preview dialog should NOT show popup-only sections.
  const sectionsForMainPreview = useMemo(() => {
    return sections.filter(section => !section.popupOnly);
  }, [sections]);


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-screen max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Form Preview</DialogTitle>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto">
          {/* The FormPreview component now receives the pre-filtered list of sections */}
          <FormPreview sections={sectionsForMainPreview} showSubmitButton={true} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
