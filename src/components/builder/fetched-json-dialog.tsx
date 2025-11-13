
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMemo } from "react";

type Props = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  jsonData: object | null;
};

export function FetchedJsonDialog({ isOpen, onOpenChange, jsonData }: Props) {
  const jsonString = useMemo(() => {
    if (!jsonData) return "";
    return JSON.stringify(jsonData, null, 2);
  }, [jsonData]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[70vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Fetched API Response</DialogTitle>
          <DialogDescription>
            This is the raw JSON response received from the API.
          </DialogDescription>
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
