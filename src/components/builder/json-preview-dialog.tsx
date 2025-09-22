
"use client";

import { useBuilder } from "@/hooks/use-builder";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

type Props = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

export function JsonPreviewDialog({ isOpen, onOpenChange }: Props) {
  const { state } = useBuilder();
  const jsonString = JSON.stringify(state.sections, null, 2);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-screen max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Form JSON Schema</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-grow rounded-md border p-4 bg-muted">
            <pre className="text-sm">
                <code>{jsonString}</code>
            </pre>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
