
"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash, X } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Separator } from "../ui/separator";

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
  
  const handleUpdateProperty = (itemId: string, oldKey: string, newKey: string, value: any) => {
    if (!newKey.trim() && oldKey !== newKey) return; // Prevent renaming to an empty key
    setLocalData(prev => prev.map(item => {
        if (item.id === itemId) {
            const { [oldKey]: _, ...rest } = item;
            return { ...rest, [newKey.trim()]: value };
        }
        return item;
    }));
  };

  const handleRemoveProperty = (itemId: string, keyToRemove: string) => {
    setLocalData(prev => prev.map(item => {
        if (item.id === itemId) {
            const { [keyToRemove]: _, ...rest } = item;
            return rest;
        }
        return item;
    }));
  };

  const handleAddNewProperty = (itemId: string) => {
    setLocalData(prev => prev.map(item => {
        if (item.id === itemId) {
            let newKey = 'new_property';
            let i = 1;
            while (Object.prototype.hasOwnProperty.call(item, newKey)) {
                newKey = `new_property_${i++}`;
            }
            return { ...item, [newKey]: '' };
        }
        return item;
    }));
  };


  const handleSaveChanges = () => {
    onSave(localData);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage Static List Items</DialogTitle>
          <DialogDescription>
            Add, edit, or remove the options for your list component. You can add hidden data properties to each item.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0">
            <ScrollArea className="h-full pr-6">
                <div className="space-y-4">
                    {localData.map((item) => (
                    <Card key={item.id} className="overflow-hidden">
                        <CardHeader className="p-4 flex flex-row items-center justify-between bg-muted/30">
                            <CardTitle className="text-base flex-1">
                                <Input
                                    value={item.label || ""}
                                    onChange={(e) => handleItemChange(item.id, "label", e.target.value)}
                                    placeholder="Primary Label"
                                    className="h-9 font-medium bg-white"
                                />
                            </CardTitle>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleRemoveItem(item.id)}>
                                <Trash className="h-4 w-4 text-destructive" />
                            </Button>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                            {(hasSecondaryText || isSecondaryTextLink) && (
                                <div className="space-y-2">
                                     {hasSecondaryText && (
                                        <div>
                                            <Label className="text-xs text-muted-foreground">Secondary Text</Label>
                                            <Input
                                                value={item.secondaryText || ""}
                                                onChange={(e) => handleItemChange(item.id, "secondaryText", e.target.value)}
                                                placeholder="Secondary Text"
                                                className="h-9"
                                            />
                                        </div>
                                    )}
                                    {isSecondaryTextLink && (
                                        <div>
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
                            )}
                            <Separator/>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Hidden Data Properties</Label>
                                <div className="space-y-2">
                                    {Object.entries(item).filter(([key]) => !['id', 'label', 'secondaryText', 'linkUrl'].includes(key)).map(([key, value]) => (
                                        <div key={key} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                                            <Input value={key} onChange={(e) => handleUpdateProperty(item.id, key, e.target.value, value)} placeholder="Key" className="h-8 text-xs"/>
                                            <Input value={value as string} onChange={(e) => handleUpdateProperty(item.id, key, key, e.target.value)} placeholder="Value" className="h-8 text-xs"/>
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleRemoveProperty(item.id, key)}>
                                                <X className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                                <Button variant="outline" size="sm" onClick={() => handleAddNewProperty(item.id)} className="mt-2">
                                    <Plus className="h-4 w-4 mr-2"/> Add Property
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                    ))}
                    <Button variant="outline" onClick={handleAddItem} className="w-full">
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
