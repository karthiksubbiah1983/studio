

"use client";

import { useBuilder } from "@/hooks/use-builder";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormPreview } from "@/components/form-preview";

type Props = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PreviewDialog({ isOpen, onOpenChange }: Props) {
  const { activeForm, sections, rules, configurations } = useBuilder();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[80vw] max-w-[80vw] h-screen max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Form Preview</DialogTitle>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto min-h-0">
          <FormPreview 
            key={activeForm?.versions[0]?.id}
            sections={sections} 
            rules={rules} 
            configurations={configurations || []}
            showSubmitButton={true} 
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
