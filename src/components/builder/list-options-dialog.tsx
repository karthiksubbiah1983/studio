
"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import { cn } from "@/lib/utils";

type StaticDataItem = {
    id: string;
    label: string;
    secondaryText?: string;
    linkUrl?: string;
    [key: string]: any;
};

type Props = {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    staticData: StaticDataItem[];
    onSave: (data: StaticDataItem[]) => void;
    hasSecondaryText: boolean;
    isSecondaryTextLink: boolean;
};

export function ListOptionsDialog({ 
    isOpen, 
    onOpenChange, 
    staticData, 
    onSave,
    hasSecondaryText,
    isSecondaryTextLink 
}: Props) {
  const [localData, setLocalData] = useState<StaticDataItem[]>([]);

  useEffect(() => {
    if (isOpen) {
      setLocalData(JSON.parse(JSON.stringify(staticData || [])));
    }
  }, [isOpen, staticData]);

  const handleAddItem = () => {
    const newItem: StaticDataItem = {
      id: crypto.randomUUID(),
      label: `Option ${localData.length + 1}`,
    };
    if (hasSecondaryText) newItem.secondaryText = "Secondary Text";
    if (isSecondaryTextLink) newItem.linkUrl = "#";
    setLocalData([...localData, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    setLocalData(localData.filter((item) => item.id !== id));
  };

  const handleItemChange = (id: string, key: string, value: any) => {
    setLocalData(
      localData.map((item) => (item.id === id ? { ...item, [key]: value } : item))
    );
  };

  const handleSaveChanges = () => {
    onSave(localData);
    onOpenChange(false);
  };

  const hasLinks = isSecondaryTextLink && hasSecondaryText;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage Static List Items</DialogTitle>
          <DialogDescription>
            Add, edit, or remove the options for your list component.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0">
            <div className="border rounded-md h-full flex flex-col">
                 <div className="grid grid-cols-[1fr_auto] items-center p-2 border-b font-medium text-sm text-muted-foreground bg-muted/50">
                    <div className="px-2">Labels & Links</div>
                    <div className="w-10"></div>
                </div>
                <ScrollArea className="flex-1">
                <div className="p-2 space-y-2">
                    {localData.map((item) => (
                    <div 
                        key={item.id} 
                        className="grid grid-cols-[1fr_auto] items-start gap-x-2 p-2 rounded-md hover:bg-muted/50"
                    >
                       <div className="flex flex-col gap-2">
                            <div className={cn("flex items-center", hasSecondaryText ? "gap-6" : "gap-2")}>
                                <div className="flex-1">
                                    <Label className="text-xs text-muted-foreground">Primary Label</Label>
                                    <Input
                                        value={item.label || ""}
                                        onChange={(e) => handleItemChange(item.id, "label", e.target.value)}
                                        placeholder="Primary Label"
                                        className="h-9"
                                    />
                                </div>
                                {hasSecondaryText && (
                                    <div className="flex-1">
                                        <Label className="text-xs text-muted-foreground">Secondary Text</Label>
                                        <Input
                                            value={item.secondaryText || ""}
                                            onChange={(e) => handleItemChange(item.id, "secondaryText", e.target.value)}
                                            placeholder="Secondary Text"
                                            className="h-9"
                                        />
                                    </div>
                                )}
                            </div>

                            {hasLinks && (
                                <div className="mt-1">
                                     <Label className="text-xs text-muted-foreground">Link URL</Label>
                                    <Input
                                        value={item.linkUrl || ""}
                                        onChange={(e) => handleItemChange(item.id, "linkUrl", e.target.value)}
                                        placeholder="https://example.com"
                                        className="h-9"
                                    />
                                </div>
                            )}
                       </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 mt-4"
                            onClick={() => handleRemoveItem(item.id)}
                        >
                            <Trash className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                    ))}
                </div>
                </ScrollArea>
                 <div className="p-2 border-t">
                    <Button variant="outline" size="sm" onClick={handleAddItem} className="w-full">
                        <Plus className="mr-2 h-4 w-4" /> Add Item
                    </Button>
                </div>
            </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveChanges}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
