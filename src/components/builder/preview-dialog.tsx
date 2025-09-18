"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FormPreview } from "./form-preview";

type Props = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PreviewDialog({ isOpen, onOpenChange }: Props) {

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-screen max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Form Preview</DialogTitle>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto">
          <FormPreview />
        </div>
      </DialogContent>
    </Dialog>
  );
}
