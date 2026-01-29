

"use client";

import { useBuilder } from "@/hooks/use-builder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { X, Plus, icons, AlignStartVertical, AlignCenterVertical, AlignEndVertical, StretchVertical, Baseline, AlignStartHorizontal, AlignCenterHorizontal, AlignEndHorizontal, AlignHorizontalSpaceBetween, AlignHorizontalSpaceAround, Pilcrow, CaseSensitive, Palette, GitCommitHorizontal, Link2, Settings2, Edit, Trash, Link, ChevronUp, ChevronDown } from "lucide-react";
import { FormElementInstance, PopupConfig, Section, Rule, Condition, RuleBehaviorType, ElementType, ListItemElement, TableColumn, Configuration, DisplayDataSourceConfig, DataGridColumn, CustomOption } from "@/lib/types";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { fetchFromApi } from "@/services/api";
import { findFirstArray, flattenObject, getAllElements, findElementRecursive } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog";
import { createNewElement } from "@/lib/form-elements";
import { FetchedJsonDialog } from "./fetched-json-dialog";
import { Checkbox } from "../ui/checkbox";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { LexicalEditor } from "../lexical/lexical-editor";
import { ScrollArea } from "../ui/scroll-area";
import { ListOptionsDialog } from "./list-options-dialog";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";


export function PropertiesSidebar() {
  const { state, dispatch, sections } = useBuilder();
  const { selectedElement } = state;

  const getSelectedElementInstance = () => {
    if (!selectedElement) return null;
    const section = sections.find(s => s.id === selectedElement.sectionId);
    if (!section) return null;

    if (selectedElement.elementId) {
        const findElementRecursive = (elements: FormElementInstance[], elementId: string): FormElementInstance | null => {
            for (const element of elements) {
                if (element.id === elementId) return element;
                if ((element.type === 'Container' || element.type === 'Popup') && element.elements) {
                    const found = findElementRecursive(element.elements, elementId);
                    if (found) return found;
                }
                 if (element.type === 'EditableTable' && element.columns) {
                    for (const col of element.columns) {
                        if (col.element.id === elementId) {
                            return col.element;
                        }
                    }
                }
            }
            return null;
        }
        return findElementRecursive(section.elements, selectedElement.elementId);
    }
    return section;
  };

  const selected = getSelectedElementInstance();
  
  const getSelectedElementName = () => {
    if (!selected) return 'Properties';
    if ('type' in selected) {
        if (selected.type === 'Combobox') return 'Combobox';
        return selected.type;
    }
    return "Section";
  }

  return (
    <div className="w-full p-4 overflow-y-auto h-full text-sm">
      <div className="flex justify-between items-center mb-2">
        <p className="text-base font-bold text-foreground">
            {getSelectedElementName()}
        </p>
      </div>
      <TooltipProvider>
        {!selected && <p className="text-sm text-muted-foreground">Select an element to see its properties.</p>}
        {selected && 'elements' in selected && !('type' in selected) && <SectionProperties section={selected} />}
        {selected && 'type' in selected && <ElementProperties element={selected} />}
      </TooltipProvider>
    </div>
  );
}

function SectionProperties({ section }: { section: Section }) {
    const { dispatch } = useBuilder();
    
    return (
        <div className="flex flex-col gap-4">
            <Accordion type="multiple" defaultValue={["general", "layout", "buttons"]} className="w-full">
                <AccordionItem value="general">
                    <AccordionTrigger className="py-2">General</AccordionTrigger>
                    <AccordionContent className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="section-title">Title</Label>
                            <Input id="section-title" value={section.title} onChange={(e) => dispatch({ type: "UPDATE_SECTION", payload: { ...section, title: e.target.value } })} />
                        </div>
                        <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                            <Label htmlFor="expose-for-validation">Expose for validation</Label>
                            <Switch
                                id="expose-for-validation"
                                checked={section.exposeForValidation || false}
                                onCheckedChange={(checked) => dispatch({ type: "UPDATE_SECTION", payload: { ...section, exposeForValidation: checked } })}
                            />
                        </div>
                         <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                            <Label htmlFor="section-hidden">Hidden in Form</Label>
                            <Switch
                                id="section-hidden"
                                checked={section.hidden || false}
                                onCheckedChange={(checked) => dispatch({ type: "UPDATE_SECTION", payload: { ...section, hidden: checked } })}
                            />
                        </div>
                    </AccordionContent>
                </AccordionItem>
                 <AccordionItem value="layout">
                    <AccordionTrigger className="py-2">Layout</AccordionTrigger>
                    <AccordionContent className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <Label>Display Mode</Label>
                            <RadioGroup
                                value={section.displayMode || 'default'}
                                onValueChange={(value) => dispatch({ type: "UPDATE_SECTION", payload: { ...section, displayMode: value as 'default' | 'accordion' } })}
                                className="flex gap-4"
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="default" id="mode-default" />
                                    <Label htmlFor="mode-default">Default</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="accordion" id="mode-accordion" />
                                    <Label htmlFor="mode-accordion">Accordion</Label>
                                </div>
                            </RadioGroup>
                        </div>
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="buttons">
                    <AccordionTrigger className="py-2">Popup Settings</AccordionTrigger>
                    <AccordionContent className="flex flex-col gap-4">
                         <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                            <Label htmlFor="popup-only">Popup Only</Label>
                            <Switch
                                id="popup-only"
                                checked={section.popupOnly || false}
                                onCheckedChange={(checked) => dispatch({ type: "UPDATE_SECTION", payload: { ...section, popupOnly: checked } })}
                            />
                        </div>
                         {section.popupOnly && (
                            <>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="confirm-text">Confirm Button Text</Label>
                                    <Input id="confirm-text" value={section.confirmButtonText || ''} onChange={(e) => dispatch({ type: "UPDATE_SECTION", payload: { ...section, confirmButtonText: e.target.value } })} placeholder="e.g., OK" />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="cancel-text">Cancel Button Text</Label>
                                    <Input id="cancel-text" value={section.cancelButtonText || ''} onChange={(e) => dispatch({ type: "UPDATE_SECTION", payload: { ...section, cancelButtonText: e.target.value } })} placeholder="e.g., Cancel" />
                                </div>
                            </>
                         )}
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    );
}

function PopupSettings({
    element,
    onUpdate,
}: {
    element: FormElementInstance;
    onUpdate: (popup: PopupConfig) => void;
}) {
    const popup = element.popup || { enabled: false, title: "", description: "", icon: "Info", iconColor: "#000000" };
    const iconNames = Object.keys(icons);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                <Label htmlFor="enable-popup">Enable Info Popup</Label>
                <Switch
                    id="enable-popup"
                    checked={popup.enabled}
                    onCheckedChange={(checked) => onUpdate({ ...popup, enabled: checked })}
                />
            </div>
            {popup.enabled && (
                <>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="popup-title">Popup Title</Label>
                        <Input
                            id="popup-title"
                            value={popup.title}
                            onChange={(e) => onUpdate({ ...popup, title: e.target.value })}
                        />
                    </div>
                     <div className="flex flex-col gap-2">
                        <Label htmlFor="popup-description">Popup Description</Label>
                        <Textarea
                            id="popup-description"
                            value={popup.description}
                            onChange={(e) => onUpdate({ ...popup, description: e.target.value })}
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="popup-icon">Icon</Label>
                         <Select
                            value={popup.icon}
                            onValueChange={(value) => onUpdate({ ...popup, icon: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select an icon" />
                            </SelectTrigger>
                            <SelectContent>
                                {iconNames.map(name => (
                                    <SelectItem key={name} value={name}>{name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="flex flex-col gap-2">
                        <Label htmlFor="popup-icon-color">Icon Color</Label>
                        <Input
                            id="popup-icon-color"
                            type="color"
                            value={popup.iconColor}
                            onChange={(e) => onUpdate({ ...popup, iconColor: e.target.value })}
                        />
                    </div>
                </>
            )}
        </div>
    );
}

function AlignmentRadioGroup({
    label,
    value,
    onValueChange,
    options
}: {
    label: string;
    value?: string;
    onValueChange: (value: string) => void;
    options: { value: string; label: string; icon: React.ElementType }[];
}) {
    return (
        <div className="flex flex-col gap-2">
            <Label>{label}</Label>
            <RadioGroup value={value} onValueChange={onValueChange} className="flex gap-1">
                {options.map((opt) => (
                     <Tooltip key={opt.value}>
                        <TooltipTrigger asChild>
                           <div>
                             <RadioGroupItem value={opt.value} id={`align-${opt.label}`} className="peer sr-only" />
                             <Label
                                htmlFor={`align-${opt.label}`}
                                className={cn(
                                    "flex items-center justify-center p-2 border rounded-md cursor-pointer transition-colors",
                                    "hover:bg-accent hover:text-accent-foreground",
                                    "peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground peer-data-[state=checked]:border-primary"
                                )}
                            >
                                <opt.icon className="h-4 w-4" />
                            </Label>
                           </div>
                        </TooltipTrigger>
                        <TooltipContent>
                           <p>{opt.label}</p>
                        </TooltipContent>
                    </Tooltip>
                ))}
            </RadioGroup>
        </div>
    )
}

function ColumnManager({
    columns,
    onUpdate,
    columnType,
}: {
    columns: (TableColumn | ListItemElement)[];
    onUpdate: (columns: (TableColumn | ListItemElement)[]) => void;
    columnType: 'table' | 'listitem';
}) {
    const [isColumnEditorOpen, setIsColumnEditorOpen] = useState(false);
    const [editingColumn, setEditingColumn] = useState<TableColumn | ListItemElement | null>(null);

    const handleAddColumn = () => {
        const newColumn = { 
            id: `new_${crypto.randomUUID()}`, 
            label: columnType === 'table' ? `Column ${columns.length + 1}` : 'New Item',
            element: createNewElement(columnType === 'table' ? 'Input' : 'Display')
        };
        setEditingColumn(newColumn as TableColumn);
        setIsColumnEditorOpen(true);
    };

    const handleEditColumn = (column: TableColumn | ListItemElement) => {
        setEditingColumn(column);
        setIsColumnEditorOpen(true);
    };

    const handleSaveColumn = () => {
        if (!editingColumn) return;
        let newColumns;
        if (editingColumn.id.startsWith('new')) {
            newColumns = [...columns, { ...editingColumn, id: crypto.randomUUID() }];
        } else {
            newColumns = columns.map(c => c.id === editingColumn.id ? editingColumn : c);
        }
        onUpdate(newColumns);
        setIsColumnEditorOpen(false);
        setEditingColumn(null);
    };

    const handleDeleteColumn = (columnId: string) => {
        onUpdate(columns.filter(c => c.id !== columnId));
    };
    
    const handleUpdateEditingColumn = (updatedColumn: TableColumn | ListItemElement) => {
        setEditingColumn(updatedColumn);
    };
    
    const handleMove = (index: number, direction: 'up' | 'down') => {
        const newColumns = [...columns];
        const [movedColumn] = newColumns.splice(index, 1);
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        newColumns.splice(newIndex, 0, movedColumn);
        onUpdate(newColumns);
    };

    const isListItem = columnType === 'listitem';

    return (
        <div className="flex flex-col gap-2">
            <Label>{isListItem ? 'Item Layout' : 'Columns'}</Label>
            <div className="flex flex-col gap-2 p-2 border rounded-md">
                {columns.map((col, index) => (
                    <div key={col.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                        <span className="text-sm font-medium">{isListItem ? (col as ListItemElement).element.label : (col as TableColumn).label}</span>
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleMove(index, 'up')} disabled={index === 0}>
                                <ChevronUp className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleMove(index, 'down')} disabled={index === columns.length - 1}>
                                <ChevronDown className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEditColumn(col)}>
                                <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteColumn(col.id)}>
                                <Trash className="h-4 w-4 text-destructive" />
                            </Button>
                        </div>
                    </div>
                ))}
                <Button variant="outline" size="sm" onClick={handleAddColumn}>
                    <Plus className="mr-2 h-4 w-4" /> Add {isListItem ? 'Element' : 'Column'}
                </Button>
            </div>
            <ColumnEditorDialog
                isOpen={isColumnEditorOpen}
                onOpenChange={setIsColumnEditorOpen}
                onSave={handleSaveColumn}
                column={editingColumn}
                onUpdate={handleUpdateEditingColumn}
                columnType={columnType}
            />
        </div>
    );
}

function ColumnEditorDialog({
    isOpen,
    onOpenChange,
    onSave,
    column: initialColumn,
    onUpdate: onUpdateProp,
    columnType,
}: {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onSave: () => void;
    column: TableColumn | ListItemElement | null;
    onUpdate: (column: TableColumn | ListItemElement) => void;
    columnType: 'table' | 'listitem';
}) {
    const column = initialColumn;

    if (!isOpen || !column) {
        return null;
    }

    const handleElementUpdate = (updatedElement: FormElementInstance) => {
        if (column && 'element' in column) {
            onUpdateProp({ ...column, element: updatedElement });
        }
    }
    
    const updateColumnProperty = (key: string, value: any) => {
        if (column) {
            onUpdateProp({ ...column, [key]: value });
        }
    };
    
    const handleFieldTypeChange = (type: ElementType) => {
        if (column && 'element' in column) {
            if (columnType === 'listitem' && type !== 'Display') return;
            const newElement = createNewElement(type);
            handleElementUpdate(newElement);
        }
    }

    const title = 'id' in column && !column?.id.startsWith('new') ? 'Edit Column' : 'Add New Column';
    const description = "Configure the properties for this column.";
    const isTableColumn = columnType === 'table';

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl h-screen max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    {description && <DialogDescription>{description}</DialogDescription>}
                </DialogHeader>
                <ScrollArea className="flex-grow -mx-6 px-6">
                    <div className="py-4 flex flex-col gap-4">
                        {isTableColumn && 'label' in column && (
                            <div className="flex flex-col gap-2">
                                <Label>Column Header</Label>
                                <Input
                                    value={column.label}
                                    onChange={(e) => updateColumnProperty('label', e.target.value)}
                                />
                            </div>
                        )}
                        
                        {'element' in column && (
                            <>
                                <Separator />
                                <h3 className="text-lg font-medium">Data Binding</h3>
                                <div className="space-y-2">
                                <Label>Column Data Key</Label>
                                <Input
                                    value={column.element.key || ''}
                                    onChange={e => handleElementUpdate({ ...column.element, key: e.target.value.replace(/\s+/g, '_').toLowerCase() })}
                                />
                                <p className="text-xs text-muted-foreground">
                                    A unique key to store this column's data for each row.
                                </p>
                                </div>
                                <Separator/>
                            </>
                        )}


                        {'element' in column && (
                            <>
                                <h3 className="text-lg font-medium">Field Properties</h3>
                                <div className="flex flex-col gap-2">
                                    <Label>Field Type</Label>
                                    <Select
                                        value={column.element.type}
                                        onValueChange={handleFieldTypeChange}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a field type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {columnType === 'listitem' ? (
                                                <SelectItem value="Display">Display Text</SelectItem>
                                            ) : (
                                                <>
                                                    <SelectItem value="Display">Display Text</SelectItem>
                                                    <SelectItem value="Select">Select</SelectItem>
                                                    <SelectItem value="Input">Input</SelectItem>
                                                    <SelectItem value="RadioGroup">Radio Group</SelectItem>
                                                    <SelectItem value="Checkbox">Checkbox</SelectItem>
                                                    <SelectItem value="Textarea">Textarea</SelectItem>
                                                    <SelectItem value="DatePicker">Date Picker</SelectItem>
                                                    <SelectItem value="Preview">Preview</SelectItem>
                                                </>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <ElementProperties
                                    element={column.element}
                                    onUpdate={handleElementUpdate}
                                    isColumnElement={true}
                                />
                            </>
                        )}
                    </div>
                </ScrollArea>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={onSave}>Save Column</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function DataGridColumnManager({
  columns,
  onUpdate,
  isTaskHistory
}: {
  columns: DataGridColumn[];
  onUpdate: (columns: DataGridColumn[]) => void;
  isTaskHistory?: boolean;
}) {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState<DataGridColumn | null>(null);

  const handleAdd = () => {
    setEditingColumn({
      id: `new_${crypto.randomUUID()}`,
      header: `Column ${columns.length + 1}`,
      element: createNewElement("Display"),
    });
    setIsEditorOpen(true);
  };

  const handleEdit = (col: DataGridColumn) => {
    setEditingColumn(col);
    setIsEditorOpen(true);
  };

  const handleSave = () => {
    if (!editingColumn) return;
    if (editingColumn.id.startsWith('new_')) {
      onUpdate([...columns, { ...editingColumn, id: crypto.randomUUID() }]);
    } else {
      onUpdate(columns.map(c => (c.id === editingColumn.id ? editingColumn : c)));
    }
    setIsEditorOpen(false);
    setEditingColumn(null);
  };
  
  const handleUpdateEditingColumn = (updatedColumn: DataGridColumn) => {
    setEditingColumn(updatedColumn);
  }

  const handleDelete = (id: string) => {
    onUpdate(columns.filter(c => c.id !== id));
  };
  
  const handleMove = (index: number, direction: 'up' | 'down') => {
    const newColumns = [...columns];
    const [movedColumn] = newColumns.splice(index, 1);
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    newColumns.splice(newIndex, 0, movedColumn);
    onUpdate(newColumns);
  };

  return (
    <div className="flex flex-col gap-2">
      <Label>Columns</Label>
      <div className="flex flex-col gap-2 p-2 border rounded-md">
        {columns.map((col, index) => (
          <div key={col.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
            <span className="text-sm font-medium">{col.header}</span>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleMove(index, 'up')} disabled={index === 0}>
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleMove(index, 'down')} disabled={index === columns.length - 1}>
                <ChevronDown className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEdit(col)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDelete(col.id)}>
                <Trash className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" /> Add Column
        </Button>
      </div>
      <DataGridColumnEditor
        isOpen={isEditorOpen}
        onOpenChange={setIsEditorOpen}
        column={editingColumn}
        onSave={handleSave}
        onUpdate={handleUpdateEditingColumn}
        isTaskHistory={isTaskHistory}
      />
    </div>
  );
}

function DataGridColumnEditor({
  isOpen,
  onOpenChange,
  column: initialColumn,
  onSave,
  onUpdate: onUpdateProp,
  isTaskHistory,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  column: DataGridColumn | null;
  onSave: () => void;
  onUpdate: (column: DataGridColumn) => void;
  isTaskHistory?: boolean;
}) {
  const { sections, datasets, state } = useBuilder();
  const { selectedElement } = state;

  const allEditableTableColumns = useMemo(() => {
    if (!isTaskHistory) return [];
    const editableTables = getAllElements(sections).filter(el => 'type' in el && el.type === 'EditableTable') as FormElementInstance[];
    const groupedColumns: { label: string; columns: { id: string; label: string }[] }[] = [];

    editableTables.forEach(table => {
        if (table.columns) {
            groupedColumns.push({
                label: table.label,
                columns: table.columns.map(col => ({ id: col.id, label: col.label }))
            });
        }
    });
    return groupedColumns;
  }, [sections, isTaskHistory]);
  
  const availableKeys = useMemo(() => {
    if (selectedElement?.elementId) {
        const dataGridElement = findElementRecursive(sections, selectedElement.elementId);
        if (dataGridElement?.type === 'DataGrid' && dataGridElement.dataSource === 'local' && dataGridElement.localDatasetName) {
            const dataset = datasets.find(ds => ds.name === dataGridElement.localDatasetName);
            if (dataset) {
                return dataset.columns.map(col => col.key);
            }
        }
    }
    return [];
  }, [selectedElement, sections, datasets]);

  const column = initialColumn;
  if (!isOpen || !column) return null;

  const handleElementUpdate = (updatedElement: FormElementInstance) => {
    onUpdateProp({ ...column, element: updatedElement });
  }

  const handleFieldTypeChange = (type: ElementType) => {
    const newElement = createNewElement(type);
    handleElementUpdate(newElement);
  }

  const allowedColumnTypes: ElementType[] = [
    'Display', 'Input', 'Select', 'Checkbox', 'RadioGroup', 'DatePicker', 'Textarea'
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-screen max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{column.id.startsWith('new_') ? 'Add' : 'Edit'} Column</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-grow -mx-6 px-6">
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Column Header Text</Label>
              <Input
                value={column.header}
                onChange={e => onUpdateProp({ ...column, header: e.target.value })}
              />
            </div>
             <div className="space-y-2">
                <Label>Column Width</Label>
                <Input
                    value={column.width || ''}
                    onChange={e => onUpdateProp({ ...column, width: e.target.value })}
                    placeholder="e.g. 150px, 20%"
                />
            </div>
            
            {isTaskHistory && (
              <>
                <Separator />
                <div className="space-y-2">
                    <Label>Map to Source Column</Label>
                    <Select
                        value={column.sourceColumnId || ''}
                        onValueChange={value => onUpdateProp({ ...column, sourceColumnId: value === 'none' ? undefined : value })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select a source column..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {allEditableTableColumns.map(group => (
                                <SelectGroup key={group.label}>
                                    <SelectLabel>{group.label}</SelectLabel>
                                    {group.columns.map(col => (
                                        <SelectItem key={col.id} value={col.id}>{col.label}</SelectItem>
                                    ))}
                                </SelectGroup>
                            ))}
                        </SelectContent>
                    </Select>
                     <p className="text-xs text-muted-foreground">
                        Map this history column to a column from an Editable Table on the form.
                    </p>
                </div>
              </>
            )}

            <Separator />
            <h3 className="text-lg font-medium">Data Binding</h3>
            <div className="space-y-2">
              <Label>Column Data Key</Label>
              <Input
                value={column.element.key || ''}
                onChange={e => handleElementUpdate({ ...column.element, key: e.target.value.replace(/\s+/g, '_').toLowerCase() })}
              />
              <p className="text-xs text-muted-foreground">
                Key from the data source to display. To create a column for user input, provide a new, unique key that is not in your data source.
              </p>
            </div>
            
            <Separator />
            <h3 className="text-lg font-medium">Field Properties</h3>
            <div className="space-y-2">
              <Label>Field Type</Label>
              <Select
                value={column.element.type}
                onValueChange={handleFieldTypeChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a field type" />
                </SelectTrigger>
                <SelectContent>
                  {allowedColumnTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
             <ElementProperties
                element={column.element}
                onUpdate={handleElementUpdate}
                isColumnElement={true}
                dataSourceKeys={availableKeys}
            />
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ElementProperties({ element, onUpdate: onUpdateProp, isColumnElement = false, dataSourceKeys = [] }: { element: FormElementInstance, onUpdate?: (element: FormElementInstance) => void, isColumnElement?: boolean, dataSourceKeys?: string[] }) {
  const { dispatch, state, sections, rules, datasets } = useBuilder();
  const { selectedElement } = state;
  const [fetchedKeys, setFetchedKeys] = useState<string[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [isFetchedJsonDialogOpen, setIsFetchedJsonDialogOpen] = useState(false);
  const [fetchedJsonData, setFetchedJsonData] = useState<object | null>(null);
  const [isListOptionsOpen, setIsListOptionsOpen] = useState(false);
  const [displayDataSourceKeys, setDisplayDataSourceKeys] = useState<string[]>([]);

  const allElements = useMemo(() => getAllElements(sections), [sections]);
  const parentSelectFields = useMemo(() => allElements.filter(el => 'type' in el && el.id !== element.id && el.type === 'Select') as FormElementInstance[], [allElements, element.id]);
  
  const findParentContainer = useCallback((elementId: string, sectionsToSearch: Section[]): FormElementInstance | null => {
    for (const section of sectionsToSearch) {
        const find = (elements: FormElementInstance[]): FormElementInstance | null => {
            if (!elements) return null;
            for (const el of elements) {
                // Check if the current element 'el' is a direct parent
                if (el.elements?.some(child => child.id === elementId)) {
                    return el;
                }
                if ((el.type === 'DataGrid' && el.dataGridColumns?.some(col => col.element.id === elementId))) {
                    return el;
                }
                if ((el.type === 'EditableTable' && el.columns?.some(col => col.element.id === elementId))) {
                    return el;
                }

                // If not a direct parent, recurse into its own children
                if (el.elements) {
                    const parent = find(el.elements);
                    if (parent) return parent;
                }
            }
            return null;
        };
        const parent = find(section.elements);
        if (parent) return parent;
    }
    return null;
  }, []);

  const parentContainer = useMemo(() => {
      if (!element?.id || !sections) return null;
      return findParentContainer(element.id, sections);
  }, [element?.id, sections, findParentContainer]);

  const parentGrid = useMemo(() => {
      if (parentContainer && parentContainer.type === 'DataGrid' && parentContainer.dataSource === 'local' && parentContainer.localDatasetName) {
          return parentContainer;
      }
      return null;
  }, [parentContainer]);

  const allAvailableKeys = useMemo(() => {
      if (parentGrid) {
          const dataset = datasets.find(ds => ds.name === parentGrid.localDatasetName);
          return dataset ? dataset.columns.map(col => col.key) : [];
      }
      
      const keys = new Set<string>();
      dataSourceKeys.forEach(k => keys.add(k));
      displayDataSourceKeys.forEach(k => keys.add(k));
      fetchedKeys.forEach(k => keys.add(k));
      return Array.from(keys);
  }, [parentGrid, datasets, dataSourceKeys, displayDataSourceKeys, fetchedKeys]);
  

  useEffect(() => {
    if ((element.type === 'Select' || element.type === 'List' || element.type === 'Combobox' || element.type === 'DataGrid') && element.dataSource === 'dynamic' && element.apiUrl) {
        handleFetchSchema(element.apiUrl, false);
    }
  }, [element.apiUrl, element.dataSource, element.type]);

  useEffect(() => {
    if (element.type === 'Display' && element.dataSourceConfig?.sourceType === 'field' && element.dataSourceConfig?.sourceElementId) {
        const sourceElement = allElements.find(el => 'id' in el && el.id === element.dataSourceConfig!.sourceElementId);
        if (sourceElement && ('type' in sourceElement) && (sourceElement.type === 'Select' || sourceElement.type === 'Combobox') && sourceElement.dataSource === 'dynamic' && sourceElement.apiUrl) {
            if (!sourceElement.apiUrl.includes('{')) {
                fetchFromApi(sourceElement.apiUrl).then(data => {
                    if (data) {
                        const dataArray = findFirstArray(data);
                        if (dataArray && dataArray.length > 0) {
                            const sample = dataArray[0];
                            if (typeof sample === 'object' && sample !== null) {
                                setDisplayDataSourceKeys(Object.keys(flattenObject(sample)));
                            } else {
                                setDisplayDataSourceKeys([]);
                            }
                        } else {
                           setDisplayDataSourceKeys([]);
                        }
                    }
                });
            } else {
                 setDisplayDataSourceKeys([]);
            }
        } else {
            setDisplayDataSourceKeys([]);
        }
    } else {
        setDisplayDataSourceKeys([]);
    }
  }, [element.type, element.dataSourceConfig?.sourceElementId, allElements]);

  const onUpdate = (newProps: FormElementInstance) => {
    if (onUpdateProp) {
        onUpdateProp(newProps);
    } else {
        if (selectedElement) {
            dispatch({ type: "UPDATE_ELEMENT", payload: { sectionId: selectedElement.sectionId, element: newProps }});
        }
    }
  };

  const updateProperty = (key: keyof FormElementInstance, value: any) => {
      let newProps = { ...element, [key]: value };

      // If adding a formula to an element without a key, auto-generate one.
      if (key === 'formula' && value && !newProps.key) {
          const generatedKey = `${newProps.type.toLowerCase().replace(/\s/g, '_')}_${Math.random().toString(36).substring(2, 7)}`;
          newProps.key = generatedKey;
      }

      onUpdate(newProps);
  };
  
  const updateMultipleProperties = (updates: Partial<FormElementInstance>) => {
    const newProps = { ...element, ...updates };
    onUpdate(newProps);
  };

  const handleApiUrlChange = (newUrl: string) => {
    updateMultipleProperties({
        apiUrl: newUrl,
        valueKey: undefined,
        labelKey: undefined,
    })
    setFetchedKeys([]);
  }

  const handleFetchSchema = async (url?: string, showPopup = true) => {
    const apiUrlToFetch = url || (element.type === 'Select' || element.type === 'List' || element.type === 'Combobox' || element.type === 'DataGrid' ? element.apiUrl : undefined);
    if (!apiUrlToFetch) {
        setFetchedKeys([]);
        return;
    };
    
    setIsFetching(true);
    try {
        const rawData = await fetchFromApi(apiUrlToFetch);
        if (rawData) {
            if (showPopup) {
                setFetchedJsonData(rawData);
                setIsFetchedJsonDialogOpen(true);
            }
            const dataArray = findFirstArray(rawData);
            if (dataArray && dataArray.length > 0) {
                const sample = dataArray[0];
                if (typeof sample === 'object' && sample !== null) {
                    setFetchedKeys(Object.keys(flattenObject(sample)));
                } else {
                     setFetchedKeys([]);
                }
            } else {
                setFetchedKeys([]);
            }
        }
    } catch (error) {
        console.error("Failed to fetch API schema:", error);
        setFetchedKeys([]);
    } finally {
        setIsFetching(false);
    }
  }

  const commonFields = (
    <>
      {!isColumnElement && (element.type !== 'Display' && element.type !== 'Container') && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="key">Field Key</Label>
            <Input id="key" value={element.key || ''} onChange={(e) => updateProperty('key', e.target.value.replace(/\s/g, '_').toLowerCase())} />
          </div>
       )}
      <div className="flex flex-col gap-2">
        <Label htmlFor="label">Label</Label>
        <Input id="label" value={element.label} onChange={(e) => updateProperty('label', e.target.value)} />
      </div>
      <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
        <Label htmlFor="required">Required</Label>
        <Switch id="required" checked={element.required} onCheckedChange={(checked) => updateProperty('required', checked)} />
      </div>
      <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
        <Label htmlFor="hidden">Hidden in Form</Label>
        <Switch id="hidden" checked={element.hidden} onCheckedChange={(checked) => updateProperty('hidden', checked)} />
      </div>
    </>
  );

  const placeholderField = (
    <div className="flex flex-col gap-2">
      <Label htmlFor="placeholder">Placeholder</Label>
      <Input id="placeholder" value={element.placeholder || ''} onChange={(e) => updateProperty('placeholder', e.target.value)} />
    </div>
  );
  
  const optionsField = (options: string[] | undefined, onUpdate: (options: string[]) => void) => (
    <div className="flex flex-col gap-2">
        <Label>Options</Label>
        {options?.map((option, index) => (
            <div key={index} className="flex items-center gap-2">
                <Input 
                    value={option}
                    onChange={(e) => {
                        const newOptions = [...options];
                        newOptions[index] = e.target.value;
                        onUpdate(newOptions);
                    }}
                />
                <Button variant="ghost" size="icon" onClick={() => {
                    const newOptions = options.filter((_, i) => i !== index);
                    onUpdate(newOptions);
                }}>
                    <X className="h-4 w-4" />
                </Button>
            </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => {
            const newOptions = [...(options || []), `Option ${ (options?.length || 0) + 1}`];
            onUpdate(newOptions);
        }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Option
        </Button>
    </div>
  );
  
  const staticDataEditor = () => {
    return (
        <div className="flex flex-col gap-4">
            <Label>Static Items</Label>
            <Button variant="outline" onClick={() => setIsListOptionsOpen(true)}>
                Manage Items ({element.staticData?.length || 0})
            </Button>
            <ListOptionsDialog
                isOpen={isListOptionsOpen}
                onOpenChange={setIsListOptionsOpen}
                staticData={element.staticData || []}
                onSave={(data) => updateProperty('staticData', data)}
                hasSecondaryText={!!element.hasSecondaryText}
                isSecondaryTextLink={!!element.isSecondaryTextLink}
            />
        </div>
    );
  }

    const customOptionsManager = () => {
        const handleAdd = () => {
            const currentOptions = element.customOptions || [];
            const newOptionText = `Custom ${currentOptions.length + 1}`;
            const newOption: CustomOption = { 
                id: crypto.randomUUID(), 
                label: newOptionText, 
                value: newOptionText 
            };
            updateProperty('customOptions', [...currentOptions, newOption]);
        }
        const handleUpdate = (id: string, text: string) => {
            const newOptions = element.customOptions?.map(opt => 
                opt.id === id ? { ...opt, label: text, value: text } : opt
            );
            updateProperty('customOptions', newOptions);
        }
        const handleDelete = (id: string) => {
            updateProperty('customOptions', element.customOptions?.filter(opt => opt.id !== id));
        }

        return (
            <div className="flex flex-col gap-4 border-t pt-4">
                <Label>Custom Static Options</Label>
                <div className="flex flex-col gap-2">
                    {element.customOptions?.map(opt => (
                        <div key={opt.id} className="flex items-center gap-2">
                            <Input placeholder="Label and Value" value={opt.label} onChange={(e) => handleUpdate(opt.id, e.target.value)} />
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(opt.id)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={handleAdd}>
                        <Plus className="mr-2 h-4 w-4" /> Add Custom Option
                    </Button>
                </div>
                 <div className="flex flex-col gap-2">
                    <Label>Position</Label>
                    <RadioGroup
                        value={element.customOptionsPosition}
                        onValueChange={(value) => updateProperty('customOptionsPosition', value as 'top' | 'bottom')}
                        className="flex gap-4"
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="top" id="pos-top" />
                            <Label htmlFor="pos-top">Top</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="bottom" id="pos-bottom" />
                            <Label htmlFor="pos-bottom">Bottom</Label>
                        </div>
                    </RadioGroup>
                </div>
            </div>
        )
    }

  const dynamicDataSourceFields = () => (
    <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
            <Label htmlFor="apiUrl">API URL</Label>
            <div className="flex gap-2">
                <Input id="apiUrl" value={element.apiUrl || ''} onChange={(e) => handleApiUrlChange(e.target.value)} placeholder="https://... or /api/..." />
                <Button onClick={() => handleFetchSchema(element.apiUrl, true)} disabled={isFetching} size="sm">
                    {isFetching ? "Fetching..." : "Fetch"}
                </Button>
            </div>
            <p className="text-xs text-muted-foreground">Use a placeholder like `&#123;id&#125;` for dynamic URLs.</p>
        </div>
        {(element.apiUrl?.includes('{') || element.dataSource === 'fromParent') && (
            <div className="flex flex-col gap-2">
                <Label>API URL Parent Field</Label>
                <Select value={element.dataSourceParentId || ""} onValueChange={(value) => updateProperty('dataSourceParentId', value)}>
                    <SelectTrigger><SelectValue placeholder="Select parent field..." /></SelectTrigger>
                    <SelectContent>
                        {parentSelectFields.map(field => <SelectItem key={field.id} value={field.id}>{field.label}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
        )}
        <>
            <div className="flex flex-col gap-2">
                <Label htmlFor="valueKey">Option Value Key</Label>
                <Select
                    value={element.valueKey || ''}
                    onValueChange={(value) => updateProperty('valueKey', value)}
                >
                    <SelectTrigger>
                        <SelectValue placeholder={fetchedKeys.length > 0 ? 'Select a key' : 'Fetch schema to see keys...'} />
                    </SelectTrigger>
                    <SelectContent>
                        {fetchedKeys.map(key => <SelectItem key={key} value={key}>{key}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="flex flex-col gap-2">
                <Label htmlFor="labelKey">Option Label Key</Label>
                <Select
                    value={element.labelKey || ''}
                    onValueChange={(value) => updateProperty('labelKey', value)}
                >
                    <SelectTrigger>
                        <SelectValue placeholder={fetchedKeys.length > 0 ? 'Select a key' : 'Fetch schema to see keys...'} />
                    </SelectTrigger>
                    <SelectContent>
                        {fetchedKeys.map(key => <SelectItem key={key} value={key}>{key}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            {element.hasSecondaryText && (
                 <div className="flex flex-col gap-2">
                    <Label htmlFor="secondaryTextKey">Secondary Text Key</Label>
                    <Select
                        value={element.secondaryTextKey || ''}
                        onValueChange={(value) => updateProperty('secondaryTextKey', value)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder={fetchedKeys.length > 0 ? 'Select a key' : 'Fetch schema to see keys...'} />
                        </SelectTrigger>
                        <SelectContent>
                            {fetchedKeys.map(key => <SelectItem key={key} value={key}>{key}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            )}
            {element.isSecondaryTextLink && (
                <div className="flex flex-col gap-2">
                    <Label htmlFor="linkUrlKey">Link URL Key</Label>
                     <Select
                        value={element.linkUrlKey || ''}
                        onValueChange={(value) => updateProperty('linkUrlKey', value)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder={allAvailableKeys.length > 0 ? 'Select a key' : 'Fetch/select data source to see keys...'} />
                        </SelectTrigger>
                        <SelectContent>
                            {allAvailableKeys.map(key => <SelectItem key={key} value={key}>{key}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            )}
        </>
        {customOptionsManager()}
    </div>
  );

  const parentDataSourceFields = () => (
    <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
            <Label>Parent Field</Label>
            <Select value={element.dataSourceParentId || ""} onValueChange={(value) => updateProperty('dataSourceParentId', value)}>
                <SelectTrigger><SelectValue placeholder="Select parent field..."/></SelectTrigger>
                <SelectContent>
                    {parentSelectFields.map(field => <SelectItem key={field.id} value={field.id}>{field.label}</SelectItem>)}
                </SelectContent>
            </Select>
        </div>
        <div className="flex flex-col gap-2">
            <Label htmlFor="dataSourceParentKey">Sub-List Key</Label>
            <Input id="dataSourceParentKey" value={element.dataSourceParentKey || ""} onChange={(e) => updateProperty('dataSourceParentKey', e.target.value)} placeholder="e.g., subCategories"/>
             <p className="text-xs text-muted-foreground">The key in the parent's selected object that holds the array of options.</p>
        </div>
    </div>
  )

  const content = () => {
      switch(element.type) {
        case "Separator":
            return null;
        case "Popup":
             return (
                <Accordion type="multiple" defaultValue={["general", "trigger", "buttons"]} className="w-full">
                    <AccordionItem value="general">
                        <AccordionTrigger className="py-2">General</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4">
                             <div className="flex flex-col gap-2">
                                <Label htmlFor="label">Label (for builder)</Label>
                                <Input id="label" value={element.label} onChange={(e) => updateProperty('label', e.target.value)} />
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="buttons">
                        <AccordionTrigger className="py-2">Buttons</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="confirm-text">Confirm Button Text</Label>
                                <Input id="confirm-text" value={element.confirmButtonText || ''} onChange={(e) => updateProperty('confirmButtonText', e.target.value)} placeholder="OK" />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="cancel-text">Cancel Button Text</Label>
                                <Input id="cancel-text" value={element.cancelButtonText || ''} onChange={(e) => updateProperty('cancelButtonText', e.target.value)} placeholder="Cancel" />
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
             );
        case "Preview":
             return (
                <Accordion type="multiple" defaultValue={["general", "sections", "layout"]} className="w-full">
                    <AccordionItem value="general">
                        <AccordionTrigger className="py-2">General</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4">
                            {commonFields}
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="sections">
                        <AccordionTrigger className="py-2">Sections to Preview</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-2">
                             {sections.filter(s => s.popupOnly).map(section => (
                                <div key={section.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`preview-${section.id}`}
                                        checked={element.previewSectionIds?.includes(section.id)}
                                        onCheckedChange={(checked) => {
                                            const currentIds = element.previewSectionIds || [];
                                            const newIds = checked ? [...currentIds, section.id] : currentIds.filter(id => id !== section.id);
                                            updateProperty('previewSectionIds', newIds);
                                        }}
                                    />
                                    <Label htmlFor={`preview-${section.id}`}>{section.title}</Label>
                                </div>
                            ))}
                        </AccordionContent>
                    </AccordionItem>
                     <AccordionItem value="layout">
                        <AccordionTrigger className="py-2">Layout</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <Label>Display Mode</Label>
                                <RadioGroup
                                    value={element.displayMode || 'popup'}
                                    onValueChange={(value) => updateProperty('displayMode', value as 'popup' | 'inline')}
                                    className="flex gap-4"
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="popup" id="display-mode-popup" />
                                        <Label htmlFor="display-mode-popup">Popup</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="inline" id="display-mode-inline" />
                                        <Label htmlFor="display-mode-inline">Inline</Label>
                                    </div>
                                </RadioGroup>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
             );
        case "Container":
             return (
                <Accordion type="multiple" defaultValue={["general", "layout"]} className="w-full">
                    <AccordionItem value="general">
                        <AccordionTrigger className="py-2">General</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4">
                             <div className="flex flex-col gap-2">
                                <Label htmlFor="width">Width</Label>
                                <Input id="width" value={element.width || ''} onChange={(e) => updateProperty('width', e.target.value)} placeholder="e.g., 50% or 200px" />
                            </div>
                            <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                <Label htmlFor="expose-for-validation">Expose for validation</Label>
                                <Switch
                                    id="expose-for-validation"
                                    checked={element.exposeForValidation || false}
                                    onCheckedChange={(checked) => updateProperty('exposeForValidation', checked)}
                                />
                            </div>
                             <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                <Label htmlFor="hidden">Hidden in Form</Label>
                                <Switch id="hidden" checked={element.hidden} onCheckedChange={(checked) => updateProperty('hidden', checked)} />
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="layout">
                        <AccordionTrigger className="py-2">Layout</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4">
                           <div className="flex flex-col gap-2">
                                <Label>Direction</Label>
                                <RadioGroup
                                    value={element.direction}
                                    onValueChange={(value) => updateProperty('direction', value as 'horizontal' | 'vertical')}
                                    className="flex gap-4"
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="vertical" id="dir-vertical" />
                                        <Label htmlFor="dir-vertical" className="flex items-center gap-2"><Pilcrow className="h-4 w-4" /> Vertical</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="horizontal" id="dir-horizontal" />
                                        <Label htmlFor="dir-horizontal" className="flex items-center gap-2"><CaseSensitive className="h-4 w-4" /> Horizontal</Label>
                                    </div>
                                </RadioGroup>
                            </div>
                            <AlignmentRadioGroup 
                                label="Justify Content"
                                value={element.justify}
                                onValueChange={(value) => updateProperty('justify', value)}
                                options={[
                                    { value: 'start', label: 'Start', icon: AlignStartHorizontal },
                                    { value: 'center', label: 'Center', icon: AlignCenterHorizontal },
                                    { value: 'end', label: 'End', icon: AlignEndHorizontal },
                                    { value: 'between', label: 'Space Between', icon: AlignHorizontalSpaceBetween },
                                    { value: 'around', label: 'Space Around', icon: AlignHorizontalSpaceAround },
                                ]}
                            />
                             <AlignmentRadioGroup 
                                label="Align Items"
                                value={element.align}
                                onValueChange={(value) => updateProperty('align', value)}
                                options={[
                                    { value: 'start', label: 'Start', icon: AlignStartVertical },
                                    { value: 'center', label: 'Center', icon: AlignCenterVertical },
                                    { value: 'end', label: 'End', icon: AlignEndVertical },
                                    { value: 'stretch', label: 'Stretch', icon: StretchVertical },
                                    { value: 'baseline', label: 'Baseline' },
                                ]}
                            />
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
             )
        case "Display":
            return (
                <Accordion type="multiple" defaultValue={["general", "data_linking", "formatting", "advanced"]} className="w-full">
                    <AccordionItem value="general">
                        <AccordionTrigger className="py-2">General</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="label">{isColumnElement ? "Fallback Display Text" : "Display Text"}</Label>
                                <Input id="label" value={element.label} onChange={(e) => updateProperty('label', e.target.value)} placeholder="Text to display if no data source" />
                                {isColumnElement && <p className="text-xs text-muted-foreground">This text is shown if the data key is not found.</p>}
                            </div>
                            {!isColumnElement && (
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="key">Field Key</Label>
                                    <Input id="key" value={element.key || ''} onChange={(e) => updateProperty('key', e.target.value.replace(/\s/g, '_').toLowerCase())} />
                                </div>
                            )}
                            <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                <Label htmlFor="expose-for-validation">Expose for validation</Label>
                                <Switch
                                    id="expose-for-validation"
                                    checked={element.exposeForValidation || false}
                                    onCheckedChange={(checked) => updateProperty('exposeForValidation', checked)}
                                />
                            </div>
                            <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                <Label htmlFor="hidden">Hidden in Form</Label>
                                <Switch id="hidden" checked={element.hidden} onCheckedChange={(checked) => updateProperty('hidden', checked)} />
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="data_linking">
                        <AccordionTrigger className="py-2">Data &amp; Linking</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4">
                            {parentGrid ? (
                                <>
                                    <div className="text-sm p-2 bg-blue-50/50 border border-blue-200 rounded-md">
                                        Data from parent grid: <span className="font-semibold">{parentGrid.localDatasetName}</span>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Label>Display Value Key</Label>
                                        <Select value={element.key || ''} onValueChange={v => updateProperty('key', v)}>
                                            <SelectTrigger><SelectValue placeholder="Select a key to display..." /></SelectTrigger>
                                            <SelectContent>
                                                {allAvailableKeys.map(key => <SelectItem key={key} value={key}>{key}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="flex flex-col gap-2">
                                        <Label>Source Type</Label>
                                        <Select 
                                            value={element.dataSourceConfig?.sourceType || 'field'} 
                                            onValueChange={(v) => updateProperty('dataSourceConfig', { ...element.dataSourceConfig, sourceType: v as any })}
                                        >
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="field">Another Form Field</SelectItem>
                                                <SelectItem value="currentUser">Current User</SelectItem>
                                                <SelectItem value="currentDateTime">Current Date/Time</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {element.dataSourceConfig?.sourceType === 'field' && (
                                        <>
                                            <div className="flex flex-col gap-2">
                                                <Label>Source Field</Label>
                                                <Select
                                                    value={element.dataSourceConfig.sourceElementId}
                                                    onValueChange={v => updateProperty('dataSourceConfig', { ...element.dataSourceConfig, sourceElementId: v, displayKey: '' })}
                                                >
                                                    <SelectTrigger><SelectValue placeholder="Select a field..."/></SelectTrigger>
                                                    <SelectContent>
                                                        {allElements.filter(el => 'type' in el && el.id !== element.id && !['DataGrid', 'EditableTable', 'PayrollTable'].includes(el.type) && !(el as any).isTableColumn).map(el => (
                                                            <SelectItem key={el.id} value={el.id}>{(el as any).label}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <Label>Display Key from Source</Label>
                                                <Select
                                                    value={element.dataSourceConfig.displayKey}
                                                    onValueChange={(value) => updateProperty('dataSourceConfig', { ...element.dataSourceConfig, displayKey: value })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder={displayDataSourceKeys.length > 0 ? "Select a key" : "No keys available from source"} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {displayDataSourceKeys.map(key => <SelectItem key={key} value={key}>{key}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </>
                                    )}
                                    {element.dataSourceConfig?.sourceType === 'currentUser' && (
                                        <div className="flex flex-col gap-2">
                                            <Label>User Property</Label>
                                            <Input 
                                                value={element.dataSourceConfig.displayKey}
                                                onChange={e => updateProperty('dataSourceConfig', {...element.dataSourceConfig, displayKey: e.target.value})}
                                                placeholder="e.g., email, uid"
                                            />
                                        </div>
                                    )}
                                </>
                            )}
                            <Separator />
                            <div className="flex flex-col gap-2">
                                <Label>Lead Text</Label>
                                <Select value={element.leadTextKey || 'none'} onValueChange={v => updateProperty('leadTextKey', v === 'none' ? null : v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Use Static Text</SelectItem>
                                        {allAvailableKeys.map(key => <SelectItem key={key} value={key}>{`Use value from "${key}"`}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                {(!element.leadTextKey || element.leadTextKey === 'none') && (
                                    <Input value={element.leadText || ''} onChange={e => updateProperty('leadText', e.target.value)} placeholder="Static lead text" />
                                )}
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                <Label htmlFor="is-link">Enable as Link</Label>
                                <Switch id="is-link" checked={!!element.isLink} onCheckedChange={checked => updateProperty('isLink', checked)} />
                            </div>
                            {element.isLink && (
                                <div className="flex flex-col gap-2">
                                    <Label>Link URL</Label>
                                    <Select value={element.linkUrlKey || 'none'} onValueChange={v => updateProperty('linkUrlKey', v === 'none' ? null : v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Use Static URL</SelectItem>
                                            {allAvailableKeys.map(key => <SelectItem key={key} value={key}>{`Use value from "${key}"`}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    {(!element.linkUrlKey || element.linkUrlKey === 'none') && (
                                        <Input value={element.linkUrl || ''} onChange={e => updateProperty('linkUrl', e.target.value)} placeholder="https://example.com/{id}" />
                                    )}
                                </div>
                            )}
                            <Separator />
                            <div className="flex flex-col gap-2">
                                <Label>Direction</Label>
                                <RadioGroup
                                    value={element.direction || 'horizontal'}
                                    onValueChange={(value) => updateProperty('direction', value as 'horizontal' | 'vertical')}
                                    className="flex gap-4"
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="horizontal" id="dir-horizontal-display" />
                                        <Label htmlFor="dir-horizontal-display">Horizontal</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="vertical" id="dir-vertical-display" />
                                        <Label htmlFor="dir-vertical-display">Vertical</Label>
                                    </div>
                                </RadioGroup>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="formatting">
                        <AccordionTrigger className="py-2">Value Formatting</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <Label>Format Type</Label>
                                <Select value={element.formatType || 'none'} onValueChange={v => updateMultipleProperties({ formatType: v as any, currency: v === 'currency' ? (element.currency || 'USD') : undefined, decimalPlaces: v !== 'none' ? (element.decimalPlaces ?? 2) : undefined })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None</SelectItem>
                                        <SelectItem value="currency">Currency</SelectItem>
                                        <SelectItem value="percentage">Percentage</SelectItem>
                                        <SelectItem value="decimal">Decimal</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {element.formatType === 'currency' && (
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="currency-code">Currency Code</Label>
                                    <Input id="currency-code" value={element.currency || 'USD'} onChange={e => updateProperty('currency', e.target.value)} placeholder="e.g., USD, EUR" />
                                </div>
                            )}
                            {(element.formatType === 'currency' || element.formatType === 'decimal' || element.formatType === 'percentage') && (
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="decimal-places">Decimal Places</Label>
                                    <Input id="decimal-places" type="number" min="0" value={element.decimalPlaces ?? 2} onChange={e => updateProperty('decimalPlaces', parseInt(e.target.value))} />
                                </div>
                            )}
                             <div className="flex flex-col gap-2">
                                <Label>Text Style</Label>
                                <Select value={element.textStyle || 'p'} onValueChange={v => updateProperty('textStyle', v as any)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="p">Paragraph</SelectItem>
                                        <SelectItem value="h1">Heading 1</SelectItem>
                                        <SelectItem value="h2">Heading 2</SelectItem>
                                        <SelectItem value="h3">Heading 3</SelectItem>
                                        <SelectItem value="h4">Heading 4</SelectItem>
                                        <SelectItem value="h5">Heading 5</SelectItem>
                                        <SelectItem value="h6">Heading 6</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="text-color">Text Color</Label>
                                <Input
                                    id="text-color"
                                    type="color"
                                    value={element.color || '#000000'}
                                    onChange={(e) => updateProperty('color', e.target.value)}
                                />
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="advanced">
                        <AccordionTrigger className="py-2">Advanced</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4">
                           <div className="flex flex-col gap-2">
                                <Label htmlFor="formula">Formula (Optional)</Label>
                                <Textarea
                                    id="formula"
                                    value={element.formula || ''}
                                    onChange={(e) => updateProperty('formula', e.target.value)}
                                    placeholder="e.g., {field_a} + {field_b}"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Use the 'Field Key' from another field.
                                </p>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                 </Accordion>
            );
        case "RichText":
            return (
                 <Accordion type="multiple" defaultValue={["general"]} className="w-full">
                    <AccordionItem value="general">
                        <AccordionTrigger className="py-2">General</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="label">Label</Label>
                                <Input id="label" value={element.label} onChange={(e) => updateProperty('label', e.target.value)} />
                            </div>
                            <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                <Label htmlFor="expose-for-validation">Expose for validation</Label>
                                <Switch
                                    id="expose-for-validation"
                                    checked={element.exposeForValidation || false}
                                    onCheckedChange={(checked) => updateProperty('exposeForValidation', checked)}
                                />
                            </div>
                             <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                <Label htmlFor="hidden">Hidden in Form</Label>
                                <Switch id="hidden" checked={element.hidden} onCheckedChange={(checked) => updateProperty('hidden', checked)} />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="content">Content</Label>
                                <LexicalComposer initialConfig={{
                                    namespace: 'FormBuilder-Properties',
                                    nodes: [],
                                    onError: console.error,
                                    editable: true,
                                }}>
                                    <LexicalEditor
                                        initialValue={element.content}
                                        onChange={(html) => updateProperty('content', html)}
                                    />
                                </LexicalComposer>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                 </Accordion>
            );
        case "Input":
             return (
                 <Accordion type="multiple" defaultValue={["general", "advanced"]} className="w-full">
                    <AccordionItem value="general">
                        <AccordionTrigger className="py-2">General</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4">
                            {commonFields}
                            {placeholderField}
                             <div className="flex flex-col gap-2">
                                <Label htmlFor="defaultValue">Default Value</Label>
                                <Input id="defaultValue" value={element.defaultValue || ''} onChange={(e) => updateProperty('defaultValue', e.target.value)} />
                            </div>
                            <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                <Label htmlFor="readOnly">Read-Only</Label>
                                <Switch id="readOnly" checked={element.readOnly} onCheckedChange={(checked) => updateProperty('readOnly', checked)} />
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                     <AccordionItem value="layout">
                        <AccordionTrigger className="py-2">Layout</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4">
                             <div className="flex flex-col gap-2">
                                <Label>Label Alignment</Label>
                                <RadioGroup
                                    value={element.labelDirection || 'vertical'}
                                    onValueChange={(value) => updateProperty('labelDirection', value as 'horizontal' | 'vertical')}
                                    className="flex gap-4"
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="vertical" id="dir-vertical-rg" />
                                        <Label htmlFor="dir-vertical-rg">Vertical</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="horizontal" id="dir-horizontal-rg" />
                                        <Label htmlFor="dir-horizontal-rg">Horizontal</Label>
                                    </div>
                                </RadioGroup>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="advanced">
                        <AccordionTrigger className="py-2">Advanced</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4">
                             <div className="flex flex-col gap-2">
                                <Label htmlFor="input-format">Format</Label>
                                <Select value={element.inputFormat || 'text'} onValueChange={v => updateProperty('inputFormat', v as 'text' | 'number' | 'alphanumeric')}>
                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="text">Text</SelectItem>
                                        <SelectItem value="number">Numbers Only</SelectItem>
                                        <SelectItem value="alphanumeric">Alphanumeric Only</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                           <div className="flex flex-col gap-2">
                                <Label htmlFor="formula">Formula (Optional)</Label>
                                <Input
                                    id="formula"
                                    value={element.formula || ''}
                                    onChange={(e) => updateProperty('formula', e.target.value)}
                                    placeholder="e.g., {field_a} + {field_b}"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Use the 'Field Key' from another column. You can find this by editing the column.
                                </p>
                            </div>
                            {element.inputFormat === 'number' && (
                                <div className="space-y-4 pt-2 border-t">
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor="fixed-length" className={cn(!!element.formula && 'text-muted-foreground')}>Fixed Digit Length</Label>
                                        <Input
                                            id="fixed-length"
                                            type="number"
                                            placeholder="e.g., 8"
                                            value={element.fixedLength || ''}
                                            onChange={(e) => updateProperty('fixedLength', e.target.value ? parseInt(e.target.value, 10) : undefined)}
                                            disabled={!!element.formula}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor="leading-char" className={cn(!!element.formula && 'text-muted-foreground')}>Leading Character (for padding)</Label>
                                        <Input
                                            id="leading-char"
                                            placeholder="e.g., 0"
                                            value={element.leadingChar || ''}
                                            onChange={(e) => updateProperty('leadingChar', e.target.value)}
                                            maxLength={1}
                                            disabled={!!element.formula}
                                        />
                                    </div>
                                </div>
                            )}
                        </AccordionContent>
                    </AccordionItem>
                 </Accordion>
            );
        case "Textarea":
             return (
                 <Accordion type="multiple" defaultValue={["general"]} className="w-full">
                    <AccordionItem value="general">
                        <AccordionTrigger className="py-2">General</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4">
                            {commonFields}
                            {placeholderField}
                        </AccordionContent>
                    </AccordionItem>
                 </Accordion>
            );
        case "Select":
            return (
                <Accordion type="multiple" defaultValue={["general", "data"]} className="w-full">
                    <AccordionItem value="general">
                        <AccordionTrigger className="py-2">General</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4">
                            {commonFields}
                            {element.placeholder !== undefined && placeholderField}
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="data">
                        <AccordionTrigger className="py-2">Data Source</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4">
                            {isColumnElement ? (
                                <>
                                   <div className="flex flex-col gap-2">
                                       <Label>Options Data Key (Optional)</Label>
                                       <Select value={element.optionsDataKey || 'none'} onValueChange={v => updateProperty('optionsDataKey', v === 'none' ? '' : v)}>
                                           <SelectTrigger>
                                               <SelectValue placeholder="Select a key..." />
                                           </SelectTrigger>
                                           <SelectContent>
                                               <SelectItem value="none">Not Applicable (Use Static)</SelectItem>
                                               {dataSourceKeys.map(key => <SelectItem key={key} value={key}>{key}</SelectItem>)}
                                           </SelectContent>
                                       </Select>
                                       <p className="text-xs text-muted-foreground">If a key is selected, it must be an array of strings in the row data.</p>
                                   </div>
                                   <Separator/>
                                </>
                            ) : null}
                             
                            {(!isColumnElement || !element.optionsDataKey) && (
                                <>
                                    <div className="flex flex-col gap-2 mb-1.5">
                                        <Label>Source Type</Label>
                                        <RadioGroup
                                            value={element.dataSource || 'static'}
                                            onValueChange={(val) => {
                                              const newDataSource = val as 'static' | 'dynamic' | 'fromParent';
                                              updateMultipleProperties({
                                                dataSource: newDataSource,
                                                options: newDataSource === 'static' ? (element.options || ['Option 1']) : undefined,
                                                apiUrl: newDataSource === 'dynamic' ? (element.apiUrl || '') : undefined,
                                                valueKey: newDataSource !== 'static' ? element.valueKey : undefined,
                                                labelKey: newDataSource !== 'static' ? element.labelKey : undefined,
                                                dataSourceParentId: newDataSource === 'fromParent' || (newDataSource === 'dynamic' && element.apiUrl?.includes('{')) ? element.dataSourceParentId : undefined,
                                                dataSourceParentKey: newDataSource === 'fromParent' ? element.dataSourceParentKey : undefined,
                                                customOptions: newDataSource === 'dynamic' ? (element.customOptions || []) : undefined,
                                              })
                                            }}
                                            className="grid grid-cols-3 gap-2"
                                        >
                                            <Label htmlFor="source-static" className="flex items-center gap-2 border p-2 rounded-md cursor-pointer hover:bg-accent has-[:checked]:bg-primary/10 has-[:checked]:border-primary">
                                                <RadioGroupItem value="static" id="source-static" />
                                                Static
                                            </Label>
                                            <Label htmlFor="source-dynamic" className="flex items-center gap-2 border p-2 rounded-md cursor-pointer hover:bg-accent has-[:checked]:bg-primary/10 has-[:checked]:border-primary">
                                                <RadioGroupItem value="dynamic" id="source-dynamic" />
                                                API
                                            </Label>
                                            <Label htmlFor="source-from-parent" className="flex items-center gap-2 border p-2 rounded-md cursor-pointer hover:bg-accent has-[:checked]:bg-primary/10 has-[:checked]:border-primary">
                                                <RadioGroupItem value="fromParent" id="source-from-parent" />
                                                Parent Field
                                            </Label>
                                        </RadioGroup>
                                    </div>
                                    {element.dataSource === 'dynamic' ? dynamicDataSourceFields() : 
                                     element.dataSource === 'fromParent' ? parentDataSourceFields() : 
                                     optionsField(element.options, (newOptions) => updateProperty('options', newOptions))}
                                </>
                            )}
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            );
        case "Combobox":
            return (
                <Accordion type="multiple" defaultValue={["general", "data"]} className="w-full">
                    <AccordionItem value="general">
                        <AccordionTrigger className="py-2">General</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4">
                            {commonFields}
                            {element.placeholder !== undefined && placeholderField}
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="data">
                        <AccordionTrigger className="py-2">Data Source</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4">
                            <RadioGroup
                                value={element.dataSource || 'static'}
                                onValueChange={(val) => {
                                      const newDataSource = val as 'static' | 'dynamic';
                                      updateMultipleProperties({
                                        dataSource: newDataSource,
                                        options: newDataSource === 'static' ? (element.options || ['Option 1']) : undefined,
                                        apiUrl: newDataSource === 'dynamic' ? (element.apiUrl || '') : undefined,
                                        valueKey: newDataSource === 'dynamic' ? element.valueKey : undefined,
                                        labelKey: newDataSource === 'dynamic' ? element.labelKey : undefined,
                                      })
                                    }}
                                className="flex"
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="static" id="source-static-combo" />
                                    <Label htmlFor="source-static-combo">Static</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="dynamic" id="source-dynamic-combo" />
                                    <Label htmlFor="source-dynamic-combo">Dynamic</Label>
                                </div>
                            </RadioGroup>
                            {element.dataSource === 'dynamic' ? dynamicDataSourceFields() : optionsField(element.options, (newOptions) => updateProperty('options', newOptions))}
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            );
        case "List":
            return (
                 <Accordion type="multiple" defaultValue={["general", "data", "layout", "scoring"]} className="w-full">
                    <AccordionItem value="general">
                        <AccordionTrigger className="py-2">General</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4">
                            {commonFields}
                            <div className="flex flex-col gap-2">
                                <Label>List Type</Label>
                                 <RadioGroup
                                    value={element.listType || 'checkbox'}
                                    onValueChange={(value) => updateProperty('listType', value as 'checkbox' | 'radio' | 'display')}
                                    className="flex gap-4"
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="checkbox" id="list-type-checkbox" />
                                        <Label htmlFor="list-type-checkbox">Checkboxes</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="radio" id="list-type-radio" />
                                        <Label htmlFor="list-type-radio">Radio Buttons</Label>
                                    </div>
                                     <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="display" id="list-type-display" />
                                        <Label htmlFor="list-type-display">Display Only</Label>
                                    </div>
                                </RadioGroup>
                            </div>
                            {element.listType !== 'display' &&
                                <div className="flex flex-col gap-2">
                                    <Label>Display Selection</Label>
                                    <Select value={element.displaySelection || 'none'} onValueChange={(value) => updateProperty('displaySelection', value)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                            <SelectItem value="selected">Show Selected</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            }
                        </AccordionContent>
                    </AccordionItem>
                     <AccordionItem value="layout">
                        <AccordionTrigger className="py-2">Layout</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4">
                           <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                <Label htmlFor="hasSecondaryText">Add Secondary Text</Label>
                                <Switch id="hasSecondaryText" checked={element.hasSecondaryText} onCheckedChange={(checked) => updateMultipleProperties({ hasSecondaryText: checked, isSecondaryTextLink: checked ? element.isSecondaryTextLink : false })} />
                            </div>
                             {element.hasSecondaryText && (
                                <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                    <Label htmlFor="isSecondaryTextLink">Enable as Link</Label>
                                    <Switch id="isSecondaryTextLink" checked={element.isSecondaryTextLink} onCheckedChange={(checked) => updateProperty('isSecondaryTextLink', checked)} />
                                </div>
                            )}
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="data">
                        <AccordionTrigger className="py-2">Data Source</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4">
                           <RadioGroup
                                value={element.dataSource || 'static'}
                                onValueChange={(val) => {
                                    const newDataSource = val as 'static' | 'dynamic';
                                    updateMultipleProperties({
                                        dataSource: newDataSource,
                                        staticData: newDataSource === 'static' ? (element.staticData || [{ id: crypto.randomUUID(), label: "Option 1" }]) : undefined,
                                        apiUrl: newDataSource === 'dynamic' ? (element.apiUrl || '') : undefined,
                                        valueKey: newDataSource === 'dynamic' ? element.valueKey : 'id',
                                        labelKey: newDataSource === 'dynamic' ? element.labelKey : 'label',
                                        secondaryTextKey: newDataSource === 'dynamic' ? element.secondaryTextKey : 'secondaryText',
                                        linkUrlKey: newDataSource === 'dynamic' ? element.linkUrlKey : 'linkUrl',
                                    })
                                }}
                                className="flex"
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="static" id="list-source-static" />
                                    <Label htmlFor="list-source-static">Static</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="dynamic" id="list-source-dynamic" />
                                    <Label htmlFor="list-source-dynamic">Dynamic</Label>
                                </div>
                            </RadioGroup>
                            {element.dataSource === 'dynamic' ? dynamicDataSourceFields() : staticDataEditor()}
                        </AccordionContent>
                    </AccordionItem>
                     <AccordionItem value="scoring">
                        <AccordionTrigger className="py-2">Scoring</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4">
                            <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                <Label htmlFor="enable-scoring">Enable Scoring</Label>
                                <Switch id="enable-scoring" checked={element.enableScoring || false} onCheckedChange={(checked) => updateMultipleProperties({ 
                                    enableScoring: checked,
                                    scorePerItem: checked ? (element.scorePerItem ?? 1) : null,
                                    passingScore: checked ? (element.passingScore ?? 1) : null,
                                 })} />
                            </div>
                            {element.enableScoring && (
                                <>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="score-per-item">Score per Item</Label>
                                    <Input id="score-per-item" type="number" value={element.scorePerItem || 1} onChange={(e) => updateProperty('scorePerItem', parseInt(e.target.value))} />
                                </div>
                                </>
                            )}
                        </AccordionContent>
                    </AccordionItem>
                 </Accordion>
            );
        case "DataList": {
            const dataset = datasets.find(d => d.name === element.localDatasetName);
            const datasetKeys = dataset ? dataset.columns.map(c => c.key) : [];
        
            return (
                <Accordion type="multiple" defaultValue={["general", "data", "layout", "scoring"]} className="w-full">
                    <AccordionItem value="general">
                        <AccordionTrigger className="py-2">General</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4">
                            {commonFields}
                            <div className="flex flex-col gap-2">
                                <Label>List Type</Label>
                                <RadioGroup
                                    value={element.listType || 'checkbox'}
                                    onValueChange={(value) => updateProperty('listType', value as 'checkbox' | 'radio' | 'display')}
                                    className="flex gap-4"
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="checkbox" id="list-type-checkbox" />
                                        <Label htmlFor="list-type-checkbox">Checkboxes</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="radio" id="list-type-radio" />
                                        <Label htmlFor="list-type-radio">Radio Buttons</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="display" id="list-type-display" />
                                        <Label htmlFor="list-type-display">Display Only</Label>
                                    </div>
                                </RadioGroup>
                            </div>
                            {element.listType !== 'display' &&
                                <div className="flex flex-col gap-2">
                                    <Label>Display Selection</Label>
                                    <Select value={element.displaySelection || 'none'} onValueChange={(value) => updateProperty('displaySelection', value)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                            <SelectItem value="selected">Show Selected</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            }
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="layout">
                        <AccordionTrigger className="py-2">Layout</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4">
                           <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                <Label htmlFor="hasSecondaryText">Add Secondary Text</Label>
                                <Switch id="hasSecondaryText" checked={element.hasSecondaryText} onCheckedChange={(checked) => updateMultipleProperties({ hasSecondaryText: checked, isSecondaryTextLink: checked ? element.isSecondaryTextLink : false })} />
                            </div>
                             {element.hasSecondaryText && (
                                <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                    <Label htmlFor="isSecondaryTextLink">Enable as Link</Label>
                                    <Switch id="isSecondaryTextLink" checked={element.isSecondaryTextLink} onCheckedChange={(checked) => updateProperty('isSecondaryTextLink', checked)} />
                                </div>
                            )}
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="data">
                        <AccordionTrigger className="py-2">Data Source</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4">
                            <div className="space-y-2">
                                <Label>Dataset</Label>
                                <Select
                                    value={element.localDatasetName || ''}
                                    onValueChange={name => updateMultipleProperties({ localDatasetName: name, valueKey: '', labelKey: '', secondaryTextKey: '', linkUrlKey: '' })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a local dataset..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {datasets?.map(ds => (
                                            <SelectItem key={ds.id} value={ds.name}>
                                                {ds.name}
                                            </SelectItem>
                                        ))}
                                        {(!datasets || datasets.length === 0) && <div className="p-4 text-center text-sm text-muted-foreground">No local datasets found.</div>}
                                    </SelectContent>
                                </Select>
                            </div>
                             {datasetKeys.length > 0 && (
                                <>
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor="valueKey">Option Value Key</Label>
                                        <Select value={element.valueKey || ''} onValueChange={(value) => updateProperty('valueKey', value)}>
                                            <SelectTrigger><SelectValue placeholder="Select a key" /></SelectTrigger>
                                            <SelectContent>
                                                {datasetKeys.map(key => <SelectItem key={key} value={key}>{key}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor="labelKey">Option Label Key</Label>
                                        <Select value={element.labelKey || ''} onValueChange={(value) => updateProperty('labelKey', value)}>
                                            <SelectTrigger><SelectValue placeholder="Select a key" /></SelectTrigger>
                                            <SelectContent>
                                                {datasetKeys.map(key => <SelectItem key={key} value={key}>{key}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {element.hasSecondaryText && (
                                        <div className="flex flex-col gap-2">
                                            <Label htmlFor="secondaryTextKey">Secondary Text Key</Label>
                                            <Select value={element.secondaryTextKey || ''} onValueChange={(value) => updateProperty('secondaryTextKey', value)}>
                                                <SelectTrigger><SelectValue placeholder="Select a key" /></SelectTrigger>
                                                <SelectContent>
                                                    {datasetKeys.map(key => <SelectItem key={key} value={key}>{key}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                    {element.isSecondaryTextLink && (
                                        <div className="flex flex-col gap-2">
                                            <Label htmlFor="linkUrlKey">Link URL Key</Label>
                                            <Select value={element.linkUrlKey || ''} onValueChange={(value) => updateProperty('linkUrlKey', value)}>
                                                <SelectTrigger><SelectValue placeholder="Select a key" /></SelectTrigger>
                                                <SelectContent>
                                                    {datasetKeys.map(key => <SelectItem key={key} value={key}>{key}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </>
                            )}
                        </AccordionContent>
                    </AccordionItem>
                     <AccordionItem value="scoring">
                        <AccordionTrigger className="py-2">Scoring</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4">
                            <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                <Label htmlFor="enable-scoring">Enable Scoring</Label>
                                <Switch id="enable-scoring" checked={element.enableScoring || false} onCheckedChange={(checked) => updateMultipleProperties({ 
                                    enableScoring: checked,
                                    scorePerItem: checked ? (element.scorePerItem ?? 1) : null,
                                    passingScore: checked ? (element.passingScore ?? 1) : null,
                                 })} />
                            </div>
                            {element.enableScoring && (
                                <>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="score-per-item">Score per Item</Label>
                                    <Input id="score-per-item" type="number" value={element.scorePerItem || 1} onChange={(e) => updateProperty('scorePerItem', parseInt(e.target.value))} />
                                </div>
                                </>
                            )}
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            );
        }
        case "RadioGroup":
            return (
                 <Accordion type="multiple" defaultValue={["general", "data", "layout"]} className="w-full">
                    <AccordionItem value="general">
                        <AccordionTrigger className="py-2">General</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4">
                            {commonFields}
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="defaultValue">Default Value</Label>
                                <Select
                                    value={element.defaultValue || ""}
                                    onValueChange={(value) => updateProperty('defaultValue', value === 'none' ? undefined : value)}
                                >
                                    <SelectTrigger id="defaultValue">
                                        <SelectValue placeholder="Select a default option" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">No default</SelectItem>
                                        {element.options?.map((option, index) => (
                                            <SelectItem key={index} value={option}>
                                                {option}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <PopupSettings element={element} onUpdate={(popup) => updateProperty('popup', popup)} />
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="data">
                        <AccordionTrigger className="py-2">Data Source</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4">
                            {isColumnElement ? (
                                <div className="flex flex-col gap-2 mb-1.5">
                                    <Label>Source Type</Label>
                                    <RadioGroup
                                        value={element.optionsDataKey ? 'fromParent' : 'static'}
                                        onValueChange={(val) => {
                                            if (val === 'static') {
                                                updateMultipleProperties({ optionsDataKey: undefined, options: element.options || ["Option 1"] });
                                            } else { // fromParent
                                                updateMultipleProperties({ optionsDataKey: '', options: undefined });
                                            }
                                        }}
                                        className="grid grid-cols-2 gap-2"
                                    >
                                        <Label htmlFor="rg-source-static" className="flex items-center gap-2 border p-2 rounded-md cursor-pointer hover:bg-accent has-[:checked]:bg-primary/10 has-[:checked]:border-primary">
                                            <RadioGroupItem value="static" id="rg-source-static" />
                                            Static
                                        </Label>
                                        <Label htmlFor="rg-source-from-parent" className="flex items-center gap-2 border p-2 rounded-md cursor-pointer hover:bg-accent has-[:checked]:bg-primary/10 has-[:checked]:border-primary">
                                            <RadioGroupItem value="fromParent" id="rg-source-from-parent" />
                                            From Parent Row
                                        </Label>
                                    </RadioGroup>
                                </div>
                            ) : null}

                            {isColumnElement && element.optionsDataKey !== undefined ? ( // Only if from parent row
                                <div className="flex flex-col gap-2">
                                    <Label>Options Data Key</Label>
                                    <Select value={element.optionsDataKey || ''} onValueChange={v => updateProperty('optionsDataKey', v)}>
                                        <SelectTrigger><SelectValue placeholder="Select a key..." /></SelectTrigger>
                                        <SelectContent>
                                            {dataSourceKeys.map(key => <SelectItem key={key} value={key}>{key}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">The key in the row data that holds the array of strings for the options.</p>
                                </div>
                            ) : ( // Static options for standalone or when column is static
                                optionsField(element.options, (newOptions) => updateProperty('options', newOptions))
                            )}
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="layout">
                        <AccordionTrigger className="py-2">Layout</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4">
                           <div className="flex flex-col gap-2">
                                <Label>Alignment</Label>
                                <RadioGroup
                                    value={element.direction || 'vertical'}
                                    onValueChange={(value) => updateProperty('direction', value as 'horizontal' | 'vertical')}
                                    className="flex gap-4"
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="vertical" id="dir-vertical-rg" />
                                        <Label htmlFor="dir-vertical-rg">Vertical</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="horizontal" id="dir-horizontal-rg" />
                                        <Label htmlFor="dir-horizontal-rg">Horizontal</Label>
                                    </div>
                                </RadioGroup>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
             );
        case "Checkbox":
            return (
                 <Accordion type="multiple" defaultValue={["general"]} className="w-full">
                    <AccordionItem value="general">
                        <AccordionTrigger className="py-2">General</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="key">Field Key</Label>
                                <Input id="key" value={element.key} onChange={(e) => updateProperty('key', e.target.value.replace(/\s/g, '_').toLowerCase())} />
                            </div>
                            <div className="flex flex-col gap-2 mt-[6px]">
                                <Label htmlFor="label">Label</Label>
                                <Input id="label" value={element.label} onChange={(e) => updateProperty('label', e.target.value)} />
                            </div>
                            <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                <Label htmlFor="required">Required</Label>
                                <Switch id="required" checked={element.required} onCheckedChange={(checked) => updateProperty('required', checked)} />
                            </div>
                            <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                <Label htmlFor="hidden">Hidden in Form</Label>
                                <Switch id="hidden" checked={element.hidden} onCheckedChange={(checked) => updateProperty('hidden', checked)} />
                            </div>
                            <PopupSettings element={element} onUpdate={(popup) => updateProperty('popup', popup)} />
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            );
        case "DatePicker":
            return (
                 <Accordion type="multiple" defaultValue={["general"]} className="w-full">
                    <AccordionItem value="general">
                        <AccordionTrigger className="py-2">General</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4">
                            {commonFields}
                            <div className="flex flex-col gap-2">
                                <Label>Validation</Label>
                                <Select value={element.dateValidation || 'all'} onValueChange={v => updateProperty('dateValidation', v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Allow all dates</SelectItem>
                                        <SelectItem value="noFuture">Disable future dates</SelectItem>
                                        <SelectItem value="noPast">Disable past dates</SelectItem>
                                        <SelectItem value="dateRange">Custom date range</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                             {element.dateValidation === 'dateRange' && (
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor="range-from">From</Label>
                                        <Input 
                                            id="range-from" 
                                            type="date" 
                                            value={element.dateValidationRange?.from || ''}
                                            onChange={(e) => updateProperty('dateValidationRange', { ...element.dateValidationRange, from: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor="range-to">To</Label>
                                         <Input 
                                            id="range-to" 
                                            type="date" 
                                            value={element.dateValidationRange?.to || ''}
                                            onChange={(e) => updateProperty('dateValidationRange', { ...element.dateValidationRange, to: e.target.value })}
                                        />
                                    </div>
                                </div>
                            )}
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            );
        case "EditableTable":
            return (
                <Accordion type="multiple" defaultValue={["general", "columns", "features"]} className="w-full">
                    <AccordionItem value="general">
                        <AccordionTrigger className="py-2">General</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4">
                            {commonFields}
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="columns">
                        <AccordionTrigger className="py-2">Columns</AccordionTrigger>
                        <AccordionContent>
                            <ColumnManager
                                columns={element.columns || []}
                                onUpdate={(newColumns) => updateProperty('columns', newColumns)}
                                columnType="table"
                            />
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="features">
                        <AccordionTrigger className="py-2">Features</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4">
                            <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                <Label htmlFor="enable-search">Enable Search</Label>
                                <Switch id="enable-search" checked={element.enableSearch} onCheckedChange={(checked) => updateProperty('enableSearch', checked)} />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="defaultRowCount">Default Row Count</Label>
                                <Input
                                    id="defaultRowCount"
                                    type="number"
                                    min="0"
                                    value={element.defaultRowCount ?? 0}
                                    onChange={(e) => updateProperty('defaultRowCount', e.target.value ? parseInt(e.target.value, 10) : 0)}
                                />
                            </div>
                             <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                    <Label htmlFor="allow-user-add-rows">Allow User to Add Rows</Label>
                                    <Switch 
                                        id="allow-user-add-rows" 
                                        checked={element.allowUserToAddRows} 
                                        onCheckedChange={(checked) => updateProperty('allowUserToAddRows', checked)}
                                    />
                                </div>
                            </div>
                            {element.allowUserToAddRows && (
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="maxRows">Max Rows</Label>
                                    <Input
                                        id="maxRows"
                                        type="number"
                                        min="1"
                                        placeholder="Unlimited"
                                        value={element.maxRows || ''}
                                        onChange={(e) => updateProperty('maxRows', e.target.value ? parseInt(e.target.value) : undefined)}
                                    />
                                </div>
                            )}
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            );
        case "DataGrid": {
            return (
                <Accordion type="multiple" defaultValue={["general", "data", "columns", "features"]} className="w-full">
                     <AccordionItem value="general">
                        <AccordionTrigger className="py-2">General</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4">
                            {commonFields}
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="data">
                        <AccordionTrigger className="py-2">Data Source</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4">
                            <RadioGroup
                                value={element.dataSource || 'dynamic'}
                                onValueChange={(val) => updateProperty('dataSource', val)}
                                className="grid grid-cols-2 gap-2"
                            >
                                <Label htmlFor="dg-source-dynamic" className="flex items-center justify-center gap-2 border p-2 rounded-md cursor-pointer hover:bg-accent has-[:checked]:bg-primary/10 has-[:checked]:border-primary">
                                    <RadioGroupItem value="dynamic" id="dg-source-dynamic" />
                                    API
                                </Label>
                                 <Label htmlFor="dg-source-local" className="flex items-center justify-center gap-2 border p-2 rounded-md cursor-pointer hover:bg-accent has-[:checked]:bg-primary/10 has-[:checked]:border-primary">
                                    <RadioGroupItem value="local" id="dg-source-local" />
                                    Local
                                </Label>
                            </RadioGroup>

                            {element.dataSource === 'local' ? (
                                <div className="space-y-2">
                                    <Label>Dataset</Label>
                                    <Select
                                        value={element.localDatasetName || ''}
                                        onValueChange={name => updateProperty('localDatasetName', name)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a local dataset..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {datasets?.map(ds => (
                                                <SelectItem key={ds.id} value={ds.name}>
                                                    {ds.name}
                                                </SelectItem>
                                            ))}
                                            {(!datasets || datasets.length === 0) && <div className="p-4 text-center text-sm text-muted-foreground">No local datasets found.</div>}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <Label htmlFor="api-url">API URL</Label>
                                    <div className="flex gap-2">
                                        <Input id="api-url" value={element.apiUrl || ""} onChange={e => handleApiUrlChange(e.target.value)} placeholder="https://api.example.com/data"/>
                                        <Button onClick={() => handleFetchSchema(element.apiUrl, true)} disabled={isFetching} size="sm">
                                            {isFetching ? "Fetching..." : "Fetch"}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="columns">
                        <AccordionTrigger className="py-2">Columns</AccordionTrigger>
                        <AccordionContent>
                             <DataGridColumnManager
                                columns={element.dataGridColumns || []}
                                onUpdate={newColumns => updateProperty('dataGridColumns', newColumns)}
                            />
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="features">
                        <AccordionTrigger className="py-2">Features</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4">
                            <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                <Label htmlFor="enable-search-grid">Enable Search</Label>
                                <Switch id="enable-search-grid" checked={element.enableSearch} onCheckedChange={(checked) => updateProperty('enableSearch', checked)} />
                            </div>
                            <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                <Label htmlFor="enable-pagination-grid">Enable Pagination</Label>
                                <Switch id="enable-pagination-grid" checked={element.enablePagination} onCheckedChange={(checked) => updateProperty('enablePagination', checked)} />
                            </div>
                            {element.enablePagination && (
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="pageSize-grid">Page Size</Label>
                                    <Input
                                        id="pageSize-grid"
                                        type="number"
                                        min="1"
                                        value={element.pageSize || 10}
                                        onChange={(e) => updateProperty('pageSize', e.target.value ? parseInt(e.target.value, 10) : 10)}
                                    />
                                </div>
                            )}
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            );
        }
        case "FileUpload":
            return (
                <Accordion type="multiple" defaultValue={["general"]} className="w-full">
                    <AccordionItem value="general">
                        <AccordionTrigger className="py-2">General</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4">
                           {commonFields}
                            <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                <Label htmlFor="multiple-files">Allow Multiple Files</Label>
                                <Switch id="multiple-files" checked={element.multiple || false} onCheckedChange={(checked) => updateProperty('multiple', checked)} />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="allowedFileTypes">Allowed File Types</Label>
                                <Input
                                    id="allowedFileTypes"
                                    placeholder="e.g., image/png, application/pdf"
                                    value={element.allowedFileTypes?.join(', ') || ''}
                                    onChange={(e) => updateProperty('allowedFileTypes', e.target.value.split(',').map(s => s.trim()))}
                                />
                                <p className="text-xs text-muted-foreground">Comma-separated MIME types.</p>
                            </div>
                             <div className="flex flex-col gap-2">
                                <Label htmlFor="maxFileSize">Max File Size (MB)</Label>
                                <Input
                                    id="maxFileSize"
                                    type="number"
                                    min="1"
                                    value={element.maxFileSize || 5}
                                    onChange={(e) => updateProperty('maxFileSize', parseInt(e.target.value))}
                                />
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            );
        case "TaskHistory":
            return (
                <Accordion type="multiple" defaultValue={["general", "data", "columns"]} className="w-full">
                    <AccordionItem value="general">
                        <AccordionTrigger className="py-2">General</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4">
                           {commonFields}
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="data">
                        <AccordionTrigger className="py-2">Data Source</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <Label>Source Editable Table</Label>
                                <Select
                                    value={element.sourceEditableTableId || ''}
                                    onValueChange={(value) => updateProperty('sourceEditableTableId', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select an editable table..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {allElements.filter(el => 'type' in el && el.type === 'EditableTable').map(table => (
                                            <SelectItem key={table.id} value={table.id}>{(table as any).label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="columns">
                        <AccordionTrigger className="py-2">Columns</AccordionTrigger>
                        <AccordionContent>
                            <DataGridColumnManager
                                columns={element.dataGridColumns || []}
                                onUpdate={newColumns => updateProperty('dataGridColumns', newColumns)}
                                isTaskHistory={true}
                            />
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            );
        default:
            return null;
      }
  }

  return (
    <div className="flex flex-col gap-4">
      {content()}
      <FetchedJsonDialog
        isOpen={isFetchedJsonDialogOpen}
        onOpenChange={setIsFetchedJsonDialogOpen}
        jsonData={fetchedJsonData}
      />
    </div>
  );
}

    

    










