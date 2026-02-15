
"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash, Edit, ChevronDown } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "../ui/checkbox";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type StaticDataItem = {
    id: string;
    label: string;
    priority?: 'na' | 'high' | 'medium' | 'low';
    brand?: string[];
    riddor?: boolean;
    [key: string]: any;
};

type Props = {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    staticData: StaticDataItem[];
    onSave: (data: StaticDataItem[]) => void;
};

// A custom multi-select dropdown component
const MultiSelectDropdown = ({
  options,
  selected,
  onChange,
  placeholder = "Select brands...",
}: {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full justify-between font-normal">
          <span className="truncate">
            {selected.length > 0 ? selected.join(", ") : placeholder}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
        {options.map((option) => (
          <DropdownMenuCheckboxItem
            key={option}
            checked={selected.includes(option)}
            onCheckedChange={(checked) => {
              const newSelection = checked
                ? [...selected, option]
                : selected.filter((item) => item !== option);
              onChange(newSelection);
            }}
          >
            {option}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export function ListOptionsDialog({ 
    isOpen, 
    onOpenChange, 
    staticData, 
    onSave,
}: Props) {
  const [localData, setLocalData] = useState<StaticDataItem[]>([]);
  const [editingItem, setEditingItem] = useState<StaticDataItem | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLocalData(JSON.parse(JSON.stringify(staticData || [])));
      setEditingItem(null); // Reset editing state when dialog opens
    }
  }, [isOpen, staticData]);

  const handleStartAddNew = () => {
    setEditingItem({
        id: `new_${crypto.randomUUID()}`,
        label: "",
        priority: "na",
        brand: [],
        riddor: false
    });
  }

  const handleEditItem = (item: StaticDataItem) => {
    setEditingItem(JSON.parse(JSON.stringify(item))); // Deep copy to avoid direct mutation
  }

  const handleUpdateEditingItem = (field: keyof StaticDataItem, value: any) => {
    if (!editingItem) return;
    setEditingItem({ ...editingItem, [field]: value });
  }

  const handleSaveEditingItem = () => {
    if (!editingItem || !editingItem.label.trim()) return;

    if (editingItem.id.startsWith('new_')) {
      // It's a new item
      setLocalData([...localData, { ...editingItem, id: crypto.randomUUID() }]);
    } else {
      // It's an existing item
      setLocalData(localData.map(item => item.id === editingItem.id ? editingItem : item));
    }
    setEditingItem(null); // Clear the form
  }
  
  const handleCancelEdit = () => {
      setEditingItem(null);
  }

  const handleDeleteItem = (id: string) => {
    setLocalData(localData.filter((item) => item.id !== id));
    if (editingItem?.id === id) {
        setEditingItem(null);
    }
  };

  const handleSaveChanges = () => {
    onSave(localData);
    onOpenChange(false);
  };
  
  const priorityOptions = [
      { value: 'na', label: 'Not Applicable' },
      { value: 'high', label: 'High' },
      { value: 'medium', label: 'Medium' },
      { value: 'low', label: 'Low' },
  ];
  
  const brandOptions = ['Restaurant', 'Premiere Inn'];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 border-b">
          <DialogTitle>Add List and Meta Properties</DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0 bg-muted/20">
            <ScrollArea className="h-full">
                <div className="p-6 space-y-6">
                    {/* Display Table */}
                    <div className="bg-white p-4 rounded-lg border">
                         <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-lg">Options</h3>
                             <Button variant="outline" size="sm" onClick={handleStartAddNew}>
                                <Plus className="h-4 w-4 mr-2" /> Add
                            </Button>
                         </div>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[40%]">Options</TableHead>
                                    <TableHead>Meta Properties</TableHead>
                                    <TableHead className="w-[80px] text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {localData.map((item) => (
                                    <TableRow key={item.id} className={cn("hover:bg-blue-50/50", editingItem?.id === item.id && "bg-blue-50")}>
                                        <TableCell className="font-medium align-top cursor-pointer" onClick={() => handleEditItem(item)}>{item.label}</TableCell>
                                        <TableCell className="align-top cursor-pointer" onClick={() => handleEditItem(item)}>
                                            <div className="flex flex-wrap gap-2">
                                                {item.priority && item.priority !== 'na' && <Badge variant="secondary">Priority: {priorityOptions.find(p => p.value === item.priority)?.label}</Badge>}
                                                {item.brand && item.brand.length > 0 && <Badge variant="secondary">Brand: {item.brand.join(', ')}</Badge>}
                                                {item.riddor && <Badge variant="secondary">Riddor: True</Badge>}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right align-top">
                                            <div className="flex justify-end gap-1">
                                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditItem(item)}>
                                                    <Edit className="h-4 w-4"/>
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteItem(item.id)}>
                                                    <Trash className="h-4 w-4 text-destructive"/>
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {localData.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center text-muted-foreground h-24">
                                            No options added yet.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Edit Form */}
                    {editingItem && (
                        <div className="bg-white p-6 rounded-lg border">
                             <h3 className="font-semibold text-lg mb-4">{editingItem.id.startsWith('new_') ? 'Add' : 'Edit'} Options & Meta Properties</h3>
                             <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                 <div className="md:col-span-2 space-y-2">
                                     <Label htmlFor="edit-option">Edit Options</Label>
                                     <Input id="edit-option" value={editingItem.label} onChange={(e) => handleUpdateEditingItem('label', e.target.value)} />
                                 </div>
                                  <div className="space-y-2">
                                     <Label htmlFor="edit-priority">Priority</Label>
                                     <Select value={editingItem.priority || 'na'} onValueChange={(value) => handleUpdateEditingItem('priority', value)}>
                                         <SelectTrigger id="edit-priority"><SelectValue/></SelectTrigger>
                                         <SelectContent>
                                             {priorityOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                                         </SelectContent>
                                     </Select>
                                 </div>
                                  <div className="space-y-2">
                                     <Label htmlFor="edit-brand">Brand</Label>
                                     <MultiSelectDropdown options={brandOptions} selected={editingItem.brand || []} onChange={(value) => handleUpdateEditingItem('brand', value)}/>
                                 </div>
                                  <div className="md:col-span-4 flex items-center space-x-2 pt-2">
                                     <Checkbox id="edit-riddor" checked={!!editingItem.riddor} onCheckedChange={(checked) => handleUpdateEditingItem('riddor', !!checked)} />
                                     <Label htmlFor="edit-riddor">Riddor</Label>
                                 </div>
                             </div>
                             <div className="flex justify-end gap-2 mt-6">
                                <Button variant="outline" onClick={handleCancelEdit}>Cancel</Button>
                                <Button onClick={handleSaveEditingItem}>{editingItem.id.startsWith('new_') ? 'Add' : 'Update'}</Button>
                             </div>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
        <DialogFooter className="p-4 border-t bg-card">
          <Button onClick={handleSaveChanges}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
