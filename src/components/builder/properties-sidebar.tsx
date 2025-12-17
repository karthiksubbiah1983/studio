

"use client";

import { useBuilder } from "@/hooks/use-builder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { X, Plus, icons, EyeOff, Eye, AlignStartVertical, AlignCenterVertical, AlignEndVertical, StretchVertical, Baseline, AlignStartHorizontal, AlignCenterHorizontal, AlignEndHorizontal, AlignHorizontalSpaceBetween, AlignHorizontalSpaceAround, Pilcrow, CaseSensitive, Palette, GitCommitHorizontal, Link2, Settings2, Edit, Trash, Link } from "lucide-react";
import { FormElementInstance, PopupConfig, Section, Rule, Condition, RuleBehaviorType, ElementType, DataGridColumn, TableColumn, ListItemElement } from "@/lib/types";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useEffect, useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { fetchFromApi } from "@/services/api";
import { findFirstArray, flattenObject, getAllElements } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog";
import { createNewElement } from "@/lib/form-elements";
import { FetchedJsonDialog } from "./fetched-json-dialog";
import { Checkbox } from "../ui/checkbox";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { LexicalEditor } from "../lexical/lexical-editor";
import { ScrollArea } from "../ui/scroll-area";


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
                if (element.type === 'Container' && element.elements) {
                    const found = findElementRecursive(element.elements, elementId);
                    if (found) return found;
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
        if (selected.type === 'Table') return 'Editable Table';
        if (selected.type === 'Preview') return 'Preview Button';
        if (selected.type === 'DataGrid') return 'Data Grid';
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
            <Accordion type="multiple" defaultValue={["general", "layout"]} className="w-full">
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
                        <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                            <Label htmlFor="popup-only">Popup Only</Label>
                            <Switch
                                id="popup-only"
                                checked={section.popupOnly || false}
                                onCheckedChange={(checked) => dispatch({ type: "UPDATE_SECTION", payload: { ...section, popupOnly: checked } })}
                            />
                        </div>
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
    parentFetchedKeys,
} : {
    columns: (TableColumn | DataGridColumn | ListItemElement)[],
    onUpdate: (columns: (TableColumn | DataGridColumn | ListItemElement)[]) => void,
    columnType: 'table' | 'datagrid' | 'listitem',
    parentFetchedKeys?: string[],
}) {
    const [isColumnEditorOpen, setIsColumnEditorOpen] = useState(false);
    const [editingColumn, setEditingColumn] = useState<TableColumn | DataGridColumn | ListItemElement | null>(null);

    const openColumnEditor = (col: TableColumn | DataGridColumn | ListItemElement | null) => {
        if (col) {
            setEditingColumn(JSON.parse(JSON.stringify(col))); // Deep clone for editing
        } else {
            const baseNewCol = {
                id: `new_${crypto.randomUUID()}`,
            };
            if (columnType === 'listitem') {
                setEditingColumn({
                    ...baseNewCol,
                    element: createNewElement('Display')
                });
            } else {
                 setEditingColumn({
                    ...baseNewCol,
                    key: `col_${(columns.length || 0) + 1}`,
                    label: `Column ${(columns.length || 0) + 1}`,
                    element: createNewElement('Display') // Always create a fully initialized element
                });
            }
        }
        setIsColumnEditorOpen(true);
    };

    const handleSaveColumn = (updatedColumn: TableColumn | DataGridColumn | ListItemElement) => {
        const isNew = 'id' in updatedColumn && updatedColumn.id.startsWith('new_');
        const finalColumn = { ...updatedColumn, id: isNew ? crypto.randomUUID() : updatedColumn.id };

        let newColumns;
        if (isNew) {
            newColumns = [...(columns || []), finalColumn];
        } else {
            newColumns = (columns || []).map(c => c.id === finalColumn.id ? finalColumn : c);
        }
        onUpdate(newColumns as any);
        setIsColumnEditorOpen(false);
        setEditingColumn(null);
    };

    const handleDeleteColumn = (columnId: string) => {
        const newCols = columns.filter(c => c.id !== columnId);
        onUpdate(newCols as any);
    }
    
    const getLabel = (col: TableColumn | DataGridColumn | ListItemElement) => {
        if ('label' in col) return col.label;
        if ('element' in col) return col.element.label || col.element.type;
        return 'Item';
    }

    return (
        <div className="flex flex-col gap-2">
            <Label>{columnType === 'listitem' ? 'List Item Elements' : 'Columns'}</Label>
            {(columns || []).map((col) => (
                <div key={col.id} className="flex items-center gap-2 p-2 border rounded-md">
                    <div className="flex-1 text-sm">{getLabel(col)} ({'element' in col && col.element.type})</div>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openColumnEditor(col)}>
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteColumn(col.id)}>
                        <Trash className="h-4 w-4 text-destructive" />
                    </Button>
                </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => openColumnEditor(null)}>
                <Plus className="mr-2 h-4 w-4" />
                Add {columnType === 'listitem' ? 'Element' : 'Column'}
            </Button>
            {isColumnEditorOpen && (
                <ColumnEditorDialog
                    isOpen={isColumnEditorOpen}
                    onOpenChange={setIsColumnEditorOpen}
                    onSave={handleSaveColumn}
                    column={editingColumn}
                    columnType={columnType}
                    parentFetchedKeys={parentFetchedKeys}
                />
            )}
        </div>
    );
}

function ColumnEditorDialog({
    isOpen,
    onOpenChange,
    onSave,
    column,
    columnType,
    parentFetchedKeys,
}: {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onSave: (column: TableColumn | DataGridColumn | ListItemElement) => void;
    column: TableColumn | DataGridColumn | ListItemElement | null;
    columnType: 'table' | 'datagrid' | 'listitem';
    parentFetchedKeys?: string[];
}) {
    const [editingColumn, setEditingColumn] = useState<TableColumn | DataGridColumn | ListItemElement | null>(null);

    useEffect(() => {
        if (column) {
            const newColumn = {...column};
            if (!('element' in newColumn) || !newColumn.element) {
                // If element is missing or null, initialize it.
                (newColumn as any).element = createNewElement('Display'); 
            } else {
                 // Ensure the existing element is fully formed by merging with a default
                 (newColumn as any).element = { ...createNewElement(newColumn.element.type), ...newColumn.element }
            }
             setEditingColumn(newColumn);
        }
    }, [column]);

    const handleSave = () => {
        if (editingColumn) {
            onSave(editingColumn);
        }
        onOpenChange(false);
    };
    
    const handleElementUpdate = (updatedElement: FormElementInstance) => {
        if (editingColumn && 'element' in editingColumn) {
            setEditingColumn({ ...editingColumn, element: updatedElement });
        }
    }
    
    const updateColumnProperty = (key: string, value: any) => {
        if (editingColumn) {
            setEditingColumn({ ...editingColumn, [key]: value });
        }
    };
    
    const handleFieldTypeChange = (type: ElementType) => {
        if (editingColumn && 'element' in editingColumn) {
            const newElement = createNewElement(type);
            handleElementUpdate(newElement);
        }
    }

    if (!isOpen || !editingColumn) {
        return null;
    }

    const title = 'id' in editingColumn && !editingColumn?.id.startsWith('new') ? 'Edit Column' : 'Add New Column';
    const description = "Configure the properties for this column.";
    const isListItemElement = columnType === 'listitem';

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl h-screen max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    {description && <DialogDescription>{description}</DialogDescription>}
                </DialogHeader>
                <ScrollArea className="flex-grow -mx-6 px-6">
                    <div className="py-4 flex flex-col gap-4">
                        {!isListItemElement && 'key' in editingColumn && (
                             <>
                                <div className="flex flex-col gap-2">
                                    <Label>Column Header</Label>
                                    <Input value={editingColumn.label} onChange={(e) => updateColumnProperty('label', e.target.value)} />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label>Column Key</Label>
                                    {parentFetchedKeys && parentFetchedKeys.length > 0 ? (
                                        <Select
                                            value={editingColumn.key}
                                            onValueChange={(value) => updateColumnProperty('key', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a data key..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {parentFetchedKeys.map(key => (
                                                    <SelectItem key={key} value={key}>{key}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <Input value={editingColumn.key} onChange={(e) => updateColumnProperty('key', e.target.value.replace(/\s+/g, '_').toLowerCase())} />
                                    )}
                                </div>
                                <Separator />
                            </>
                        )}
                        {columnType === 'table' && 'formula' in editingColumn && (
                             <div className="flex flex-col gap-2">
                                <Label>Formula (Optional)</Label>
                                <Input 
                                    placeholder="e.g. {col_1} * {col_2}"
                                    value={editingColumn.formula || ''}
                                    onChange={(e) => updateColumnProperty('formula', e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">
                                    If a formula is provided, this column will be read-only and calculated automatically. Use {'{column_key}'} to reference other columns.
                                </p>
                            </div>
                        )}

                        {'element' in editingColumn && (!('formula' in editingColumn) || !editingColumn.formula) && (
                            <>
                                <h3 className="text-lg font-medium">Field Properties</h3>
                                <div className="flex flex-col gap-2">
                                    <Label>Field Type</Label>
                                    <Select
                                        value={editingColumn.element.type}
                                        onValueChange={handleFieldTypeChange}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a field type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Input">Input</SelectItem>
                                            <SelectItem value="Textarea">Textarea</SelectItem>
                                            <SelectItem value="Select">Select</SelectItem>
                                            <SelectItem value="Checkbox">Checkbox</SelectItem>
                                            <SelectItem value="RadioGroup">Radio Group</SelectItem>
                                            <SelectItem value="DatePicker">Date Picker</SelectItem>
                                            <SelectItem value="Display">Display Text</SelectItem>
                                            <SelectItem value="Combobox">Combobox</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <ElementProperties
                                    element={editingColumn.element}
                                    onUpdate={handleElementUpdate}
                                    isColumnElement={true}
                                    parentFetchedKeys={parentFetchedKeys}
                                />
                            </>
                        )}
                    </div>
                </ScrollArea>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave}>Save Column</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function ElementProperties({ element, onUpdate: onUpdateProp, isColumnElement = false, parentFetchedKeys }: { element: FormElementInstance, onUpdate?: (element: FormElementInstance) => void, isColumnElement?: boolean, parentFetchedKeys?: string[] }) {
  const { dispatch, state, sections } = useBuilder();
  const [props, setProps] = useState(element);
  const { selectedElement } = state;
  const [fetchedKeys, setFetchedKeys] = useState<string[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [isFetchedJsonDialogOpen, setIsFetchedJsonDialogOpen] = useState(false);
  const [fetchedJsonData, setFetchedJsonData] = useState<object | null>(null);

  const allElements = getAllElements(sections);
  
  const finalFetchedKeys = parentFetchedKeys || fetchedKeys;

  useEffect(() => {
    setProps(element);
    if ((element.type === 'Select' || element.type === 'List' || element.type === 'DataGrid' || element.type === 'Table' || element.type === 'Combobox') && element.apiUrl) {
        handleFetchSchema(element.apiUrl, false);
    }
  }, [element]);

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
      const newProps = { ...props, [key]: value };
      setProps(newProps);
      onUpdate(newProps);
  };
  
  const updateMultipleProperties = (updates: Partial<FormElementInstance>) => {
    const newProps = { ...props, ...updates };
    setProps(newProps);
    onUpdate(newProps);
  };

  const handleApiUrlChange = (newUrl: string) => {
    updateMultipleProperties({
        apiUrl: newUrl,
        valueKey: undefined,
        labelKey: undefined,
        dataGridColumns: props.type === 'DataGrid' ? props.dataGridColumns?.map(c => ({...c, key: ''})) : props.dataGridColumns,
    })
    setFetchedKeys([]);
  }

  const handleFetchSchema = async (url?: string, showPopup = true) => {
    let apiUrlToFetch = url || (props.type === 'DataGrid' || props.type === 'Select' || props.type === 'List' || props.type === 'Table' || props.type === 'Combobox' ? props.apiUrl : undefined);
    if (!apiUrlToFetch) {
        setFetchedKeys([]);
        return;
    };
    
    // Handle URL templates
    if (apiUrlToFetch.includes('{') && apiUrlToFetch.includes('}')) {
        const placeholder = apiUrlToFetch.match(/\{(.+?)\}/)?.[1];
        const sampleValue = prompt(`The API URL is a template. Please provide a sample value for '{${placeholder}}' to fetch the schema:`);
        if (!sampleValue) {
            return;
        }
        apiUrlToFetch = apiUrlToFetch.replace(`{${placeholder}}`, encodeURIComponent(sampleValue));
    }

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
      {(!isColumnElement || (props.type === 'Display')) && <div className="flex flex-col gap-2">
        <Label htmlFor="key">Field Key</Label>
        <Input id="key" value={props.key} onChange={(e) => updateProperty('key', e.target.value.replace(/\s+/g, '_').toLowerCase())} />
      </div>}
      <div className="flex flex-col gap-2">
        <Label htmlFor="label">Label</Label>
        <Input id="label" value={props.label} onChange={(e) => updateProperty('label', e.target.value)} />
      </div>
      <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
        <Label htmlFor="required">Required</Label>
        <Switch id="required" checked={props.required} onCheckedChange={(checked) => updateProperty('required', checked)} />
      </div>
      <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
        <Label htmlFor="hidden">Hidden in Form</Label>
        <Switch id="hidden" checked={props.hidden} onCheckedChange={(checked) => updateProperty('hidden', checked)} />
      </div>
    </>
  );

  const placeholderField = (
    <div className="flex flex-col gap-2">
      <Label htmlFor="placeholder">Placeholder</Label>
      <Input id="placeholder" value={props.placeholder || ''} onChange={(e) => updateProperty('placeholder', e.target.value)} />
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

  const dynamicDataSourceFields = () => (
    <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
            <Label htmlFor="apiUrl">API URL</Label>
            <div className="flex gap-2">
                <Input id="apiUrl" value={props.apiUrl || ''} onChange={(e) => handleApiUrlChange(e.target.value)} />
                <Button onClick={() => handleFetchSchema(props.apiUrl, true)} disabled={isFetching} size="sm">
                    {isFetching ? "Fetching..." : "Fetch"}
                </Button>
            </div>
        </div>
        <>
            <div className="flex flex-col gap-2">
                <Label htmlFor="valueKey">Option Value Key</Label>
                <Select
                    value={props.valueKey || ''}
                    onValueChange={(value) => updateProperty('valueKey', value)}
                >
                    <SelectTrigger>
                        <SelectValue placeholder={finalFetchedKeys.length > 0 ? 'Select a key' : 'Fetch schema to see keys...'} />
                    </SelectTrigger>
                    <SelectContent>
                        {finalFetchedKeys.map(key => <SelectItem key={key} value={key}>{key}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="flex flex-col gap-2">
                <Label htmlFor="labelKey">Option Label Key</Label>
                <Select
                    value={props.labelKey || ''}
                    onValueChange={(value) => updateProperty('labelKey', value)}
                >
                    <SelectTrigger>
                        <SelectValue placeholder={finalFetchedKeys.length > 0 ? 'Select a key' : 'Fetch schema to see keys...'} />
                    </SelectTrigger>
                    <SelectContent>
                        {finalFetchedKeys.map(key => <SelectItem key={key} value={key}>{key}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
        </>
    </div>
  );

  const content = () => {
      switch(props.type) {
        case "Separator":
            return null;
        case "Container":
             return (
                <Accordion type="multiple" defaultValue={["general", "layout"]} className="w-full">
                    <AccordionItem value="general">
                        <AccordionTrigger className="py-2">General</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4">
                            <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                <Label htmlFor="expose-for-validation">Expose for validation</Label>
                                <Switch
                                    id="expose-for-validation"
                                    checked={props.exposeForValidation || false}
                                    onCheckedChange={(checked) => updateProperty('exposeForValidation', checked)}
                                />
                            </div>
                             <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                <Label htmlFor="hidden">Hidden in Form</Label>
                                <Switch id="hidden" checked={props.hidden} onCheckedChange={(checked) => updateProperty('hidden', checked)} />
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="layout">
                        <AccordionTrigger className="py-2">Layout</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4">
                           <div className="flex flex-col gap-2">
                                <Label>Direction</Label>
                                <RadioGroup
                                    value={props.direction}
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
                                value={props.justify}
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
                                value={props.align}
                                onValueChange={(value) => updateProperty('align', value)}
                                options={[
                                    { value: 'start', label: 'Start', icon: AlignStartVertical },
                                    { value: 'center', label: 'Center', icon: AlignCenterVertical },
                                    { value: 'end', label: 'End', icon: AlignEndVertical },
                                    { value: 'stretch', label: 'Stretch', icon: StretchVertical },
                                    { value: 'baseline', label: 'Baseline', icon: Baseline },
                                ]}
                            />
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
             )
        case "Display":
            const config = props.dataSourceConfig || { sourceElementId: "", displayKey: "", sourceType: 'field' };

            return (
                 <Accordion type="multiple" defaultValue={["general", "link", "data", "advanced"]} className="w-full">
                    <AccordionItem value="general">
                        <AccordionTrigger className="py-2">General</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="key">Field Key</Label>
                                <Input id="key" value={props.key} onChange={(e) => updateProperty('key', e.target.value.replace(/\s+/g, '_').toLowerCase())} />
                            </div>
                             <div className="flex flex-col gap-2">
                                <Label htmlFor="label">Text / Label</Label>
                                <Input id="label" value={props.label} onChange={(e) => updateProperty('label', e.target.value)} />
                            </div>
                            <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                <Label htmlFor="expose-for-validation">Expose for validation</Label>
                                <Switch
                                    id="expose-for-validation"
                                    checked={props.exposeForValidation || false}
                                    onCheckedChange={(checked) => updateProperty('exposeForValidation', checked)}
                                />
                            </div>
                            <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                <Label htmlFor="hidden">Hidden in Form</Label>
                                <Switch id="hidden" checked={props.hidden} onCheckedChange={(checked) => updateProperty('hidden', checked)} />
                            </div>
                            {!props.isLink && (
                                <>
                                <div className="flex flex-col gap-2">
                                    <Label>Text Style</Label>
                                    <Select value={props.textStyle || 'p'} onValueChange={v => updateProperty('textStyle', v as any)}>
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
                                        value={props.color || '#000000'}
                                        onChange={(e) => updateProperty('color', e.target.value)}
                                    />
                                </div>
                                </>
                            )}
                        </AccordionContent>
                    </AccordionItem>
                     <AccordionItem value="link">
                        <AccordionTrigger className="py-2">Link Settings</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4">
                           <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                <Label htmlFor="is-link">Enable as Link</Label>
                                <Switch id="is-link" checked={!!props.isLink} onCheckedChange={(checked) => updateMultipleProperties({ isLink: checked, linkUrl: checked ? (props.linkUrl || '') : null })} />
                            </div>
                            {props.isLink && (
                                <>
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor="link-url">URL Template</Label>
                                        <Input id="link-url" value={props.linkUrl || ''} onChange={(e) => updateProperty('linkUrl', e.target.value)} placeholder="https://example.com/users/{id}" />
                                        <p className="text-xs text-muted-foreground">
                                            Use {'{key}'} to insert values from a source field.
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Label>URL Data Source</Label>
                                        <Select 
                                            value={props.linkUrlSourceElementId || "none"}
                                            onValueChange={v => updateProperty('linkUrlSourceElementId', v === 'none' ? null : v)}
                                        >
                                            <SelectTrigger><SelectValue placeholder="Select a field..." /></SelectTrigger>
                                            <SelectContent>
                                                 <SelectItem value="none">None (Uses main form state)</SelectItem>
                                                 {allElements.filter(el => 'type' in el && el.type === 'Select').map(el => (
                                                    <SelectItem key={el.id} value={el.id}>{el.label}</SelectItem>
                                                 ))}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-muted-foreground">
                                           Select a field to source the data for the URL template. This is typically a `Select` field that returns an object.
                                        </p>
                                    </div>
                                </>
                            )}
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="data">
                        <AccordionTrigger className="py-2">Data Source</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <Label>Source Type</Label>
                                <Select
                                    value={config.sourceType || "field"}
                                    onValueChange={(value) => {
                                        const newConfig = { ...config, sourceType: value as any, sourceElementId: "", displayKey: "" };
                                        updateProperty('dataSourceConfig', newConfig);
                                    }}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="field">Form Field</SelectItem>
                                        <SelectItem value="currentUser">Current User</SelectItem>
                                        <SelectItem value="currentDateTime">Current Date/Time</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {config.sourceType === "field" && (
                                <>
                                    <div className="flex flex-col gap-2">
                                        <Label>Source Field</Label>
                                        <Select
                                            value={config.sourceElementId || "none"}
                                            onValueChange={(value) => {
                                                const sourceElement = allElements.find(el => el.id === value);
                                                const newConfig = { 
                                                    ...config, 
                                                    sourceElementId: value === "none" ? "" : value,
                                                    // Reset display key if the source is not a select
                                                    displayKey: sourceElement?.type === 'Select' ? config.displayKey : ""
                                                };
                                                updateProperty('dataSourceConfig', newConfig);
                                            }}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a field..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">None</SelectItem>
                                                {allElements.map(el => 'key' in el && el.key && (
                                                    <SelectItem key={el.id} value={el.id}>{el.label} ({el.type})</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    { config.sourceElementId && allElements.find(el => el.id === config.sourceElementId)?.type === 'Select' && (
                                        <div className="flex flex-col gap-2">
                                            <Label htmlFor="display-key">Display Key (from Select object)</Label>
                                            <Input 
                                                id="display-key" 
                                                value={config.displayKey}
                                                onChange={(e) => updateProperty('dataSourceConfig', { ...config, displayKey: e.target.value })}
                                                placeholder="e.g., 'email' or 'address.city'"
                                            />
                                            <p className="text-xs text-muted-foreground">Key from the selected object to display.</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="advanced">
                        <AccordionTrigger className="py-2">Advanced</AccordionTrigger>
                        <AccordionContent>
                           <div className="flex flex-col gap-2">
                                <Label htmlFor="formula">Formula (Optional)</Label>
                                <Input
                                    id="formula"
                                    value={props.formula || ''}
                                    onChange={(e) => updateProperty('formula', e.target.value)}
                                    placeholder="e.g., {field_a} + {field_b}"
                                />
                                <p className="text-xs text-muted-foreground">
                                    If a formula is provided, this field will be read-only.
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
                                <Input id="label" value={props.label} onChange={(e) => updateProperty('label', e.target.value)} />
                            </div>
                            <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                <Label htmlFor="expose-for-validation">Expose for validation</Label>
                                <Switch
                                    id="expose-for-validation"
                                    checked={props.exposeForValidation || false}
                                    onCheckedChange={(checked) => updateProperty('exposeForValidation', checked)}
                                />
                            </div>
                             <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                <Label htmlFor="hidden">Hidden in Form</Label>
                                <Switch id="hidden" checked={props.hidden} onCheckedChange={(checked) => updateProperty('hidden', checked)} />
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
                                        initialValue={props.content}
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
                                <Input id="defaultValue" value={props.defaultValue || ''} onChange={(e) => updateProperty('defaultValue', e.target.value)} />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="input-format">Format</Label>
                                <Select value={props.inputFormat || 'text'} onValueChange={(v) => updateProperty('inputFormat', v as 'text' | 'number' | 'alphanumeric')}>
                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="text">Text</SelectItem>
                                        <SelectItem value="number">Numbers Only</SelectItem>
                                        <SelectItem value="alphanumeric">Alphanumeric Only</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="advanced">
                        <AccordionTrigger className="py-2">Advanced</AccordionTrigger>
                        <AccordionContent>
                           <div className="flex flex-col gap-2">
                                <Label htmlFor="formula">Formula (Optional)</Label>
                                <Input
                                    id="formula"
                                    value={props.formula || ''}
                                    onChange={(e) => updateProperty('formula', e.target.value)}
                                    placeholder="e.g., {field_a} + {field_b}"
                                />
                                <p className="text-xs text-muted-foreground">
                                    If a formula is provided, this field will be read-only.
                                </p>
                            </div>
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
                            {props.placeholder !== undefined && placeholderField}
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="data">
                        <AccordionTrigger className="py-2">Data Source</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4">
                             <div className="flex flex-col gap-2 mb-1.5">
                                <Label>Source Type</Label>
                                <RadioGroup
                                    value={props.dataSource || 'static'}
                                    onValueChange={(val) => {
                                      const newDataSource = val as 'static' | 'dynamic';
                                      updateMultipleProperties({
                                        dataSource: newDataSource,
                                        options: newDataSource === 'static' ? (props.options || ['Option 1']) : null,
                                        apiUrl: newDataSource === 'dynamic' ? (props.apiUrl || '') : null,
                                        valueKey: newDataSource === 'dynamic' ? props.valueKey : null,
                                        labelKey: newDataSource === 'dynamic' ? props.labelKey : null,
                                      })
                                    }}
                                    className="flex"
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="static" id="source-static" />
                                        <Label htmlFor="source-static">Static</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="dynamic" id="source-dynamic" />
                                        <Label htmlFor="source-dynamic">Dynamic</Label>
                                    </div>
                                </RadioGroup>
                            </div>
                            {props.dataSource === 'dynamic' ? dynamicDataSourceFields() : optionsField(props.options, (newOptions) => updateProperty('options', newOptions))}
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
                            {props.placeholder !== undefined && placeholderField}
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="data">
                        <AccordionTrigger className="py-2">Data Source</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4">
                            <RadioGroup
                                value={props.dataSource || 'static'}
                                onValueChange={(val) => {
                                      const newDataSource = val as 'static' | 'dynamic';
                                      updateMultipleProperties({
                                        dataSource: newDataSource,
                                        options: newDataSource === 'static' ? (props.options || ['Option 1']) : null,
                                        apiUrl: newDataSource === 'dynamic' ? (props.apiUrl || '') : null,
                                        valueKey: newDataSource === 'dynamic' ? props.valueKey : null,
                                        labelKey: newDataSource === 'dynamic' ? props.labelKey : null,
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
                            {props.dataSource === 'dynamic' ? dynamicDataSourceFields() : optionsField(props.options, (newOptions) => updateProperty('options', newOptions))}
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            );
        case "List":
            return (
                 <Accordion type="multiple" defaultValue={["general", "data", "scoring", "layout"]} className="w-full">
                    <AccordionItem value="general">
                        <AccordionTrigger className="py-2">General</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4">
                            {commonFields}
                            <div className="flex flex-col gap-2">
                                <Label>List Type</Label>
                                 <RadioGroup
                                    value={props.listType || 'checkbox'}
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
                            {props.listType !== 'display' &&
                                <div className="flex flex-col gap-2">
                                    <Label>Display Selection</Label>
                                    <Select value={props.displaySelection || 'none'} onValueChange={(value) => updateProperty('displaySelection', value)}>
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
                    <AccordionItem value="data">
                        <AccordionTrigger className="py-2">Data Source</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4">
                           <RadioGroup
                                value={props.dataSource || 'static'}
                                onValueChange={(val) => {
                                    const newDataSource = val as 'static' | 'dynamic';
                                    updateMultipleProperties({
                                        dataSource: newDataSource,
                                        options: newDataSource === 'static' ? (props.options || ['Option 1']) : null,
                                        apiUrl: newDataSource === 'dynamic' ? (props.apiUrl || '') : null,
                                        valueKey: newDataSource === 'dynamic' ? props.valueKey : null,
                                        labelKey: newDataSource === 'dynamic' ? props.labelKey : null,
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
                            {props.dataSource === 'dynamic' ? dynamicDataSourceFields() : optionsField(props.options, (newOptions) => updateProperty('options', newOptions))}
                        </AccordionContent>
                    </AccordionItem>
                    { (props.listType === 'display') &&
                        <AccordionItem value="layout">
                            <AccordionTrigger className="py-2">List Item Layout</AccordionTrigger>
                            <AccordionContent>
                                <ColumnManager
                                    columns={props.listItemElements || []}
                                    onUpdate={(newItems) => updateProperty('listItemElements', newItems)}
                                    columnType="listitem"
                                />
                            </AccordionContent>
                        </AccordionItem>
                    }
                     <AccordionItem value="scoring">
                        <AccordionTrigger className="py-2">Scoring</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4">
                            <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                <Label htmlFor="enable-scoring">Enable Scoring</Label>
                                <Switch id="enable-scoring" checked={props.enableScoring || false} onCheckedChange={(checked) => updateMultipleProperties({ 
                                    enableScoring: checked,
                                    scorePerItem: checked ? (props.scorePerItem ?? 1) : null,
                                    passingScore: checked ? (props.passingScore ?? 1) : null,
                                 })} />
                            </div>
                            {props.enableScoring && (
                                <>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="score-per-item">Score per Item</Label>
                                    <Input id="score-per-item" type="number" value={props.scorePerItem || 1} onChange={(e) => updateProperty('scorePerItem', parseInt(e.target.value))} />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="passing-score">Passing Score</Label>
                                    <Input id="passing-score" type="number" value={props.passingScore || 1} onChange={(e) => updateProperty('passingScore', parseInt(e.target.value))} />
                                </div>
                                </>
                            )}
                        </AccordionContent>
                    </AccordionItem>
                 </Accordion>
            );
        case "DataGrid":
            return (
                 <>
                    <Accordion type="multiple" defaultValue={["general", "columns"]} className="w-full">
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
                                    columns={props.dataGridColumns || []}
                                    onUpdate={(newColumns) => updateProperty('dataGridColumns', newColumns)}
                                    columnType="datagrid"
                                />
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                 </>
            )
        case "Table":
            return (
                <>
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
                                value={props.dataSource || 'static'}
                                onValueChange={(v) => {
                                    const isStatic = v === 'static';
                                    updateMultipleProperties({
                                        dataSource: v as 'static' | 'dynamic',
                                        apiUrl: isStatic ? null : (props.apiUrl || ''),
                                        canAddRows: isStatic ? (props.canAddRows ?? true) : false,
                                        defaultRows: isStatic ? (props.defaultRows ?? 1) : null,
                                    });
                                }}
                                className="flex"
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="static" id="table-source-static" />
                                    <Label htmlFor="table-source-static">Static Rows</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="dynamic" id="table-source-dynamic" />
                                    <Label htmlFor="table-source-dynamic">Dynamic Data</Label>
                                </div>
                            </RadioGroup>
                            {props.dataSource === 'dynamic' && (
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="table-apiUrl">API URL</Label>
                                    <div className="flex gap-2">
                                        <Input id="table-apiUrl" value={props.apiUrl || ''} onChange={(e) => handleApiUrlChange(e.target.value)} />
                                        <Button onClick={() => handleFetchSchema(props.apiUrl, true)} disabled={isFetching} size="sm">
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
                           <ColumnManager
                                columns={props.tableColumns || []}
                                onUpdate={(newColumns) => updateProperty('tableColumns', newColumns)}
                                columnType="table"
                                parentFetchedKeys={finalFetchedKeys}
                            />
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="features">
                        <AccordionTrigger className="py-2">Features</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4">
                           <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                <Label htmlFor="enable-search">Enable Search</Label>
                                <Switch id="enable-search" checked={props.enableSearch || false} onCheckedChange={(checked) => updateProperty('enableSearch', checked)} />
                            </div>
                             {props.dataSource !== 'dynamic' && (
                                <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                    <Label htmlFor="can-add-rows">User can add rows</Label>
                                    <Switch id="can-add-rows" checked={props.canAddRows === false ? false : true} onCheckedChange={(checked) => updateProperty('canAddRows', checked)} />
                                </div>
                            )}
                             {props.canAddRows && props.dataSource !== 'dynamic' && (
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="max-rows">Max Rows (Optional)</Label>
                                    <Input
                                        id="max-rows"
                                        type="number"
                                        min="0"
                                        placeholder="No limit"
                                        value={props.maxRows || ''}
                                        onChange={(e) => updateProperty('maxRows', e.target.value ? parseInt(e.target.value) : null)}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Leave blank for no limit.
                                    </p>
                                </div>
                             )}
                             {props.dataSource !== 'dynamic' && (
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="default-rows">Default Rows</Label>
                                    <Input
                                        id="default-rows"
                                        type="number"
                                        min="0"
                                        value={props.defaultRows || 0}
                                        onChange={(e) => updateProperty('defaultRows', parseInt(e.target.value) || 0)}
                                    />
                                </div>
                            )}
                             <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                <Label htmlFor="pagination-enabled">Enable Pagination</Label>
                                <Switch 
                                    id="pagination-enabled" 
                                    checked={props.paginationEnabled || false} 
                                    onCheckedChange={(checked) => updateMultipleProperties({ 
                                        paginationEnabled: checked,
                                        pageSize: checked ? (props.pageSize ?? 5) : null
                                    })} 
                                />
                            </div>
                            {props.paginationEnabled && (
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="page-size">Page Size</Label>
                                    <Input 
                                        id="page-size" 
                                        type="number" 
                                        value={props.pageSize || 5} 
                                        onChange={(e) => updateProperty('pageSize', parseInt(e.target.value))}
                                        min={1}
                                    />
                                </div>
                            )}
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
                </>
            );
        case "RadioGroup":
            return (
                 <Accordion type="multiple" defaultValue={["general", "layout"]} className="w-full">
                    <AccordionItem value="general">
                        <AccordionTrigger className="py-2">General</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4">
                            {commonFields}
                            {optionsField(props.options, (newOptions) => updateProperty('options', newOptions))}
                            <PopupSettings element={props} onUpdate={(popup) => updateProperty('popup', popup)} />
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="layout">
                        <AccordionTrigger className="py-2">Layout</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4">
                           <div className="flex flex-col gap-2">
                                <Label>Alignment</Label>
                                <RadioGroup
                                    value={props.direction || 'vertical'}
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
                                <Input id="key" value={props.key} onChange={(e) => updateProperty('key', e.target.value.replace(/\s+/g, '_').toLowerCase())} />
                            </div>
                            <div className="flex flex-col gap-2 mt-[6px]">
                                <Label htmlFor="label">Label</Label>
                                <Input id="label" value={props.label} onChange={(e) => updateProperty('label', e.target.value)} />
                            </div>
                            <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                <Label htmlFor="required">Required</Label>
                                <Switch id="required" checked={props.required} onCheckedChange={(checked) => updateProperty('required', checked)} />
                            </div>
                            <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                <Label htmlFor="hidden">Hidden in Form</Label>
                                <Switch id="hidden" checked={props.hidden} onCheckedChange={(checked) => updateProperty('hidden', checked)} />
                            </div>
                            <PopupSettings element={props} onUpdate={(popup) => updateProperty('popup', popup)} />
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            );
        case "DatePicker":
            return (
                 <Accordion type="multiple" defaultValue={["general"]} className="w-full">
                    <AccordionItem value="general">
                        <AccordionTrigger className="py-2">General</AccordionTrigger>
                        <AccordionContent>
                            {commonFields}
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            );
        case "Preview":
            return (
                <Accordion type="multiple" defaultValue={["general", "sections"]} className="w-full">
                    <AccordionItem value="general">
                        <AccordionTrigger className="py-2">General</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="label">Button Label</Label>
                                <Input id="label" value={props.label} onChange={(e) => updateProperty('label', e.target.value)} />
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="sections">
                        <AccordionTrigger className="py-2">Sections to Preview</AccordionTrigger>
                        <AccordionContent>
                             <div className="flex flex-col gap-2">
                                {sections.map(section => (
                                    <div key={section.id} className="flex items-center space-x-2">
                                        <Checkbox 
                                            id={`section-preview-${section.id}`}
                                            checked={(props.previewSectionIds || []).includes(section.id)}
                                            onCheckedChange={(checked) => {
                                                const currentIds = props.previewSectionIds || [];
                                                let newIds;
                                                if (checked) {
                                                    newIds = [...currentIds, section.id];
                                                } else {
                                                    newIds = currentIds.filter(id => id !== section.id);
                                                }
                                                updateProperty('previewSectionIds', newIds);
                                            }}
                                        />
                                        <Label htmlFor={`section-preview-${section.id}`}>{section.title}</Label>
                                    </div>
                                ))}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            );
        case "FileUpload":
            return (
                <Accordion type="multiple" defaultValue={["general"]} className="w-full">
                    <AccordionItem value="general">
                        <AccordionTrigger className="py-2">General</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4">
                           {commonFields}
                            <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                <Label htmlFor="multiple-files">Allow Multiple Files</Label>
                                <Switch id="multiple-files" checked={props.multiple || false} onCheckedChange={(checked) => updateProperty('multiple', checked)} />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="allowedFileTypes">Allowed File Types</Label>
                                <Input
                                    id="allowedFileTypes"
                                    placeholder="e.g., image/png, application/pdf"
                                    value={props.allowedFileTypes?.join(', ') || ''}
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
                                    value={props.maxFileSize || 5}
                                    onChange={(e) => updateProperty('maxFileSize', parseInt(e.target.value))}
                                />
                            </div>
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
