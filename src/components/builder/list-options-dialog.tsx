
"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";

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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage Static List Items</DialogTitle>
          <DialogDescription>
            Add, edit, or remove the options for your list component.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0">
            <ScrollArea className="h-full pr-6">
            <div className="space-y-4">
                {localData.map((item) => (
                <div key={item.id} className="border p-4 rounded-md space-y-3 relative bg-background">
                    <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6"
                    onClick={() => handleRemoveItem(item.id)}
                    >
                    <Trash className="h-4 w-4 text-destructive" />
                    </Button>
                    <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Primary Label</Label>
                    <Input
                        value={item.label || ""}
                        onChange={(e) => handleItemChange(item.id, "label", e.target.value)}
                        placeholder="Primary Label"
                    />
                    </div>
                    {hasSecondaryText && (
                    <div className="flex flex-col gap-1.5">
                        <Label className="text-xs">Secondary Text</Label>
                        <Input
                        value={item.secondaryText || ""}
                        onChange={(e) =>
                            handleItemChange(item.id, "secondaryText", e.target.value)
                        }
                        placeholder="Secondary Text"
                        />
                    </div>
                    )}
                    {isSecondaryTextLink && (
                    <div className="flex flex-col gap-1.5">
                        <Label className="text-xs">Link URL</Label>
                        <Input
                        value={item.linkUrl || ""}
                        onChange={(e) =>
                            handleItemChange(item.id, "linkUrl", e.target.value)
                        }
                        placeholder="https://example.com"
                        />
                    </div>
                    )}
                </div>
                ))}
                <Button variant="outline" size="sm" onClick={handleAddItem} className="w-full">
                    <Plus className="mr-2 h-4 w-4" /> Add Item
                </Button>
            </div>
            </ScrollArea>
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
