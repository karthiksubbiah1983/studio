

"use client";

import { useMemo } from "react";
import { useBuilder } from "@/hooks/use-builder";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormPreview } from "@/components/form-preview";
import { Section } from "@/lib/types";

type Props = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PreviewDialog({ isOpen, onOpenChange }: Props) {
  const { sections } = useBuilder();

  // Filter out sections that are designated for popups only for the main preview.
  const sectionsForMainPreview: Section[] = useMemo(() => {
    return sections.filter(section => !section.popupOnly);
  }, [sections]);


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[80vw] max-w-[80vw] h-screen max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Form Preview</DialogTitle>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto min-h-0">
          {/* The FormPreview component now receives the pre-filtered list of sections */}
          <FormPreview sections={sectionsForMainPreview} showSubmitButton={true} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
