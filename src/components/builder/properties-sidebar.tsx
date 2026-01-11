

"use client";

import { useBuilder } from "@/hooks/use-builder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { X, Plus, icons, AlignStartVertical, AlignCenterVertical, AlignEndVertical, StretchVertical, Baseline, AlignStartHorizontal, AlignCenterHorizontal, AlignEndHorizontal, AlignHorizontalSpaceBetween, AlignHorizontalSpaceAround, Pilcrow, CaseSensitive, Palette, GitCommitHorizontal, Link2, Settings2, Edit, Trash, Link } from "lucide-react";
import { FormElementInstance, PopupConfig, Section, Rule, Condition, RuleBehaviorType, ElementType, ListItemElement, TableColumn, Configuration, DisplayDataSourceConfig } from "@/lib/types";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
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
import { ListOptionsDialog } from "./list-options-dialog";


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
    parentFetchedData,
}: {
    columns: (TableColumn | ListItemElement)[];
    onUpdate: (columns: (TableColumn | ListItemElement)[]) => void;
    columnType: 'table' | 'listitem';
    parentFetchedData?: Record<string,any> | null;
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

    const handleSaveColumn = (updatedColumn: TableColumn | ListItemElement) => {
        let newColumns;
        if (updatedColumn.id.startsWith('new')) {
            newColumns = [...columns, { ...updatedColumn, id: crypto.randomUUID() }];
        } else {
            newColumns = columns.map(c => c.id === updatedColumn.id ? updatedColumn : c);
        }
        onUpdate(newColumns);
    };

    const handleDeleteColumn = (columnId: string) => {
        onUpdate(columns.filter(c => c.id !== columnId));
    };

    const isListItem = columnType === 'listitem';

    return (
        <div className="flex flex-col gap-2">
            <Label>{isListItem ? 'Item Layout' : 'Columns'}</Label>
            <div className="flex flex-col gap-2 p-2 border rounded-md">
                {columns.map(col => (
                    <div key={col.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                        <span className="text-sm font-medium">{isListItem ? (col as ListItemElement).element.label : (col as TableColumn).label}</span>
                        <div className="flex items-center gap-1">
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
                columnType={columnType}
                parentFetchedData={parentFetchedData}
            />
        </div>
    );
}

function ColumnEditorDialog({
    isOpen,
    onOpenChange,
    onSave,
    column,
    columnType,
    parentFetchedData,
}: {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onSave: (column: TableColumn | ListItemElement) => void;
    column: TableColumn | ListItemElement | null;
    columnType: 'table' | 'listitem',
    parentFetchedData?: Record<string, any> | null;
}) {
    const [editingColumn, setEditingColumn] = useState<TableColumn | ListItemElement | null>(null);

    useEffect(() => {
        if (column) {
            const newColumn = {...column};
            if (!('element' in newColumn) || !newColumn.element) {
                // If element is missing or null, initialize it.
                (newColumn as any).element = createNewElement(columnType === 'table' ? 'Input' : 'Display'); 
            } else {
                 // Ensure the existing element is fully formed by merging with a default
                 (newColumn as any).element = { ...createNewElement(newColumn.element.type), ...newColumn.element }
            }
             setEditingColumn(newColumn);
        }
    }, [column, columnType]);

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
            if (columnType === 'listitem' && type !== 'Display') return;
            const newElement = createNewElement(type);
            handleElementUpdate(newElement);
        }
    }

    if (!isOpen || !editingColumn) {
        return null;
    }

    const title = 'id' in editingColumn && !editingColumn?.id.startsWith('new') ? 'Edit Column' : 'Add New Column';
    const description = "Configure the properties for this column.";
    const isTableColumn = columnType === 'table';
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
                        {isTableColumn && 'label' in editingColumn && (
                            <div className="flex flex-col gap-2">
                                <Label>Column Header</Label>
                                <Input
                                    value={editingColumn.label}
                                    onChange={(e) => updateColumnProperty('label', e.target.value)}
                                />
                            </div>
                        )}
                         {isTableColumn && 'labelKey' in editingColumn && parentFetchedData && (
                            <div className="flex flex-col gap-2">
                                <Label>Header Label Key</Label>
                                <Select value={editingColumn.labelKey || ''} onValueChange={(value) => updateColumnProperty('labelKey', value)}>
                                    <SelectTrigger><SelectValue placeholder="Select a key..."/></SelectTrigger>
                                    <SelectContent>
                                        {Object.keys(parentFetchedData).map(key => (
                                            <SelectItem key={key} value={key}>{key}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        {'element' in editingColumn && (
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
                                                </>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <ElementProperties
                                    element={editingColumn.element}
                                    onUpdate={handleElementUpdate}
                                    isColumnElement={true}
                                    parentFetchedData={parentFetchedData}
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

function ElementProperties({ element, onUpdate: onUpdateProp, isColumnElement = false, parentFetchedData }: { element: FormElementInstance, onUpdate?: (element: FormElementInstance) => void, isColumnElement?: boolean, parentFetchedData?: Record<string, any> | null }) {
  const { dispatch, state, sections } = useBuilder();
  const [props, setProps] = useState(element);
  const { selectedElement } = state;
  const [fetchedKeys, setFetchedKeys] = useState<string[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [isFetchedJsonDialogOpen, setIsFetchedJsonDialogOpen] = useState(false);
  const [fetchedJsonData, setFetchedJsonData] = useState<object | null>(null);
  const [isListOptionsOpen, setIsListOptionsOpen] = useState(false);

  const allElements = getAllElements(sections);
  const parentSelectFields = useMemo(() => allElements.filter(el => 'type' in el && el.id !== props.id && el.type === 'Select') as FormElementInstance[], [allElements, props.id]);

  
  const finalFetchedKeys = useMemo(() => {
    if (parentFetchedData) {
        return Object.keys(flattenObject(parentFetchedData));
    }
    return fetchedKeys;
  }, [parentFetchedData, fetchedKeys]);

  useEffect(() => {
    setProps(element);
    if ((element.type === 'Select' || element.type === 'List' || element.type === 'Combobox' || element.type === 'EditableTable') && element.dataSource === 'dynamic' && element.apiUrl) {
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
    })
    setFetchedKeys([]);
  }

  const handleFetchSchema = async (url?: string, showPopup = true) => {
    let apiUrlToFetch = url || (props.type === 'Select' || props.type === 'List' || props.type === 'Combobox' ? props.apiUrl : undefined);
    if (!apiUrlToFetch) {
        setFetchedKeys([]);
        return;
    };
    
    // Handle URL templates
    if (apiUrlToFetch.includes('{') && apiUrlToFetch.includes('}')) {
        const placeholder = apiUrlToFetch.match(/\{(.+?)\}/)?.[1];
        if (!placeholder) {
          setIsFetching(false);
          return;
        }
        
        // Find the parent to get a sample value. We can't prompt the user.
        const parentElement = allElements.find(el => el.id === props.dataSourceParentId);
        if (parentElement && 'key' in parentElement && parentElement.key === placeholder) {
          // This is tricky because we don't have form state here.
          // We can't fetch schema for templated URLs without a sample value.
          // For now, we will just not fetch. A better solution might be to ask the user.
          console.warn("Cannot auto-fetch schema for templated URL without a sample value.");
          setFetchedKeys([]);
          return;
        } else {
            const sampleValue = prompt(`The API URL is a template. Please provide a sample value for '{${placeholder}}' to fetch the schema:`);
            if (!sampleValue) {
                return;
            }
            apiUrlToFetch = apiUrlToFetch.replace(`{${placeholder}}`, encodeURIComponent(sampleValue));
        }

    }

    setIsFetching(true);
    try {
        const rawData = await fetchFromApi(apiUrlToFetch);
        if (rawData) {
            if (showPopup) {
                setFetchedJsonData(rawData);
                setIsFetchedJsonDialogOpen(true);
            }
            if (props.type === 'EditableTable') {
                const flatData = flattenObject(rawData);
                setFetchedKeys(Object.keys(flatData));
            } else {
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
      {(props.type !== 'Display' || isColumnElement) && props.type !== 'Container' ? (
          <div className="flex flex-col gap-2">
            <Label htmlFor="key">Field Key</Label>
            <Input id="key" value={props.key || ''} onChange={(e) => updateProperty('key', e.target.value.replace(/\s+/g, '_').toLowerCase())} />
          </div>
       ) : null}
      <div className="flex flex-col gap-2">
        <Label htmlFor="label">Label</Label>
        <Input id="label" value={props.label} onChange={(e) => updateProperty('label', e.target.value)} />
      </div>
      { isColumnElement && parentFetchedData && (
         <div className="flex flex-col gap-2">
            <Label htmlFor="labelKey">Label Key</Label>
            <Select value={props.labelKey || ''} onValueChange={(value) => updateProperty('labelKey', value)}>
                <SelectTrigger><SelectValue placeholder="Select a key..."/></SelectTrigger>
                <SelectContent>
                    {Object.keys(parentFetchedData).map(key => (
                        <SelectItem key={key} value={key}>{key}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
      )}
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
  
  const staticDataEditor = () => {
    return (
        <div className="flex flex-col gap-4">
            <Label>Static Items</Label>
            <Button variant="outline" onClick={() => setIsListOptionsOpen(true)}>
                Manage Items ({props.staticData?.length || 0})
            </Button>
            <ListOptionsDialog
                isOpen={isListOptionsOpen}
                onOpenChange={setIsListOptionsOpen}
                staticData={props.staticData || []}
                onSave={(data) => updateProperty('staticData', data)}
                hasSecondaryText={!!props.hasSecondaryText}
                isSecondaryTextLink={!!props.isSecondaryTextLink}
            />
        </div>
    );
  }

  const dynamicDataSourceFields = () => (
    <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
            <Label htmlFor="apiUrl">API URL</Label>
            <div className="flex gap-2">
                <Input id="apiUrl" value={props.apiUrl || ''} onChange={(e) => handleApiUrlChange(e.target.value)} placeholder="https://... or /api/..." />
                <Button onClick={() => handleFetchSchema(props.apiUrl, true)} disabled={isFetching} size="sm">
                    {isFetching ? "Fetching..." : "Fetch"}
                </Button>
            </div>
            <p className="text-xs text-muted-foreground">Use a placeholder like `&#123;id&#125;` for dynamic URLs.</p>
        </div>
        {props.apiUrl?.includes('{') && (
            <div className="flex flex-col gap-2">
                <Label>API URL Parent Field</Label>
                <Select value={props.dataSourceParentId || ""} onValueChange={(value) => updateProperty('dataSourceParentId', value)}>
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
            {props.hasSecondaryText && (
                 <div className="flex flex-col gap-2">
                    <Label htmlFor="secondaryTextKey">Secondary Text Key</Label>
                    <Select
                        value={props.secondaryTextKey || ''}
                        onValueChange={(value) => updateProperty('secondaryTextKey', value)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder={finalFetchedKeys.length > 0 ? 'Select a key' : 'Fetch schema to see keys...'} />
                        </SelectTrigger>
                        <SelectContent>
                            {finalFetchedKeys.map(key => <SelectItem key={key} value={key}>{key}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            )}
            {props.isSecondaryTextLink && (
                <div className="flex flex-col gap-2">
                    <Label htmlFor="linkUrlKey">Link URL Key</Label>
                    <Select
                        value={props.linkUrlKey || ''}
                        onValueChange={(value) => updateProperty('linkUrlKey', value)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder={finalFetchedKeys.length > 0 ? 'Select a key' : 'Fetch schema to see keys...'} />
                        </SelectTrigger>
                        <SelectContent>
                            {finalFetchedKeys.map(key => <SelectItem key={key} value={key}>{key}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            )}
        </>
    </div>
  );

  const parentDataSourceFields = () => (
    <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
            <Label>Parent Field</Label>
            <Select value={props.dataSourceParentId || ""} onValueChange={(value) => updateProperty('dataSourceParentId', value)}>
                <SelectTrigger><SelectValue placeholder="Select parent field..."/></SelectTrigger>
                <SelectContent>
                    {parentSelectFields.map(field => <SelectItem key={field.id} value={field.id}>{field.label}</SelectItem>)}
                </SelectContent>
            </Select>
        </div>
        <div className="flex flex-col gap-2">
            <Label htmlFor="dataSourceParentKey">Sub-List Key</Label>
            <Input id="dataSourceParentKey" value={props.dataSourceParentKey || ""} onChange={(e) => updateProperty('dataSourceParentKey', e.target.value)} placeholder="e.g., subCategories"/>
             <p className="text-xs text-muted-foreground">The key in the parent's selected object that holds the array of options.</p>
        </div>
    </div>
  )

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
                             <div className="flex flex-col gap-2">
                                <Label htmlFor="width">Width</Label>
                                <Input id="width" value={props.width || ''} onChange={(e) => updateProperty('width', e.target.value)} placeholder="e.g., 50% or 200px" />
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
            return (
                 <Accordion type="multiple" defaultValue={["general", "layout", "data", "formatting", "advanced", "link"]} className="w-full">
                    <AccordionItem value="general">
                        <AccordionTrigger className="py-2">General</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="label">Display Text</Label>
                                <Input id="label" value={props.label} onChange={(e) => updateProperty('label', e.target.value)} placeholder="Text to display if no data source" />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="key">Field Key</Label>
                                <Input id="key" value={props.key} onChange={(e) => updateProperty('key', e.target.value.replace(/\s+/g, '_').toLowerCase())} />
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
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="data">
                        <AccordionTrigger className="py-2">Data Source</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <Label>Source Type</Label>
                                <Select 
                                    value={props.dataSourceConfig?.sourceType || 'field'} 
                                    onValueChange={(v) => {
                                        const newConfig: DisplayDataSourceConfig = {
                                            ...(props.dataSourceConfig || { sourceElementId: '', displayKey: '' }),
                                            sourceType: v as any
                                        };
                                        updateProperty('dataSourceConfig', newConfig)
                                    }}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="field">Another Form Field</SelectItem>
                                        <SelectItem value="currentUser">Current User</SelectItem>
                                        <SelectItem value="currentDateTime">Current Date/Time</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {props.dataSourceConfig?.sourceType === 'field' && (
                                <>
                                    <div className="flex flex-col gap-2">
                                        <Label>Source Field</Label>
                                        <Select
                                            value={props.dataSourceConfig.sourceElementId}
                                            onValueChange={v => updateProperty('dataSourceConfig', { ...props.dataSourceConfig, sourceElementId: v })}
                                        >
                                            <SelectTrigger><SelectValue placeholder="Select a field..."/></SelectTrigger>
                                            <SelectContent>
                                                {allElements.filter(el => 'type' in el && el.id !== props.id).map(el => (
                                                    <SelectItem key={el.id} value={el.id}>{el.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Label>Display Key from Source</Label>
                                        <Input
                                            value={props.dataSourceConfig.displayKey}
                                            onChange={e => updateProperty('dataSourceConfig', { ...props.dataSourceConfig, displayKey: e.target.value })}
                                            placeholder="e.g., name, address.city"
                                        />
                                        <p className="text-xs text-muted-foreground">For objects, use dot notation.</p>
                                    </div>
                                </>
                            )}
                             {props.dataSourceConfig?.sourceType === 'currentUser' && (
                                <div className="flex flex-col gap-2">
                                    <Label>User Property</Label>
                                    <Input 
                                        value={props.dataSourceConfig.displayKey}
                                        onChange={e => updateProperty('dataSourceConfig', {...props.dataSourceConfig, displayKey: e.target.value})}
                                        placeholder="e.g., email, uid"
                                    />
                                </div>
                             )}
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="layout">
                        <AccordionTrigger className="py-2">Layout</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4">
                           <div className="flex flex-col gap-2">
                                <Label htmlFor="leadText">Lead Text</Label>
                                <Input id="leadText" value={props.leadText || ''} onChange={(e) => updateProperty('leadText', e.target.value)} />
                            </div>
                             <div className="flex flex-col gap-2">
                                <Label>Direction</Label>
                                <RadioGroup
                                    value={props.direction || 'horizontal'}
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
                                <Select value={props.formatType || 'none'} onValueChange={v => updateMultipleProperties({ formatType: v as any, currency: v === 'currency' ? (props.currency || 'USD') : undefined, decimalPlaces: v !== 'none' ? (props.decimalPlaces ?? 2) : undefined })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None</SelectItem>
                                        <SelectItem value="currency">Currency</SelectItem>
                                        <SelectItem value="percentage">Percentage</SelectItem>
                                        <SelectItem value="decimal">Decimal</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {props.formatType === 'currency' && (
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="currency-code">Currency Code</Label>
                                    <Input id="currency-code" value={props.currency || 'USD'} onChange={e => updateProperty('currency', e.target.value)} placeholder="e.g., USD, EUR" />
                                </div>
                            )}
                            {(props.formatType === 'currency' || props.formatType === 'decimal' || props.formatType === 'percentage') && (
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="decimal-places">Decimal Places</Label>
                                    <Input id="decimal-places" type="number" min="0" value={props.decimalPlaces ?? 2} onChange={e => updateProperty('decimalPlaces', parseInt(e.target.value))} />
                                </div>
                            )}
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
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="advanced">
                        <AccordionTrigger className="py-2">Advanced</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4">
                           <div className="flex flex-col gap-2">
                                <Label htmlFor="formula">Formula (Optional)</Label>
                                <Textarea
                                    id="formula"
                                    value={props.formula || ''}
                                    onChange={(e) => updateProperty('formula', e.target.value)}
                                    placeholder="e.g., {field_a} + {field_b}"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Use the 'Field Key' from another field.
                                </p>
                            </div>
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
                                            Use {'{key}'} to insert values from a source field. For lists, this is sourced per item.
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
                            <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                <Label htmlFor="readOnly">Read-Only</Label>
                                <Switch id="readOnly" checked={props.readOnly} onCheckedChange={(checked) => updateProperty('readOnly', checked)} />
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                     <AccordionItem value="layout">
                        <AccordionTrigger className="py-2">Layout</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4">
                             <div className="flex flex-col gap-2">
                                <Label>Label Alignment</Label>
                                <RadioGroup
                                    value={props.labelDirection || 'vertical'}
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
                                <Select value={props.inputFormat || 'text'} onValueChange={(v) => updateProperty('inputFormat', v as 'text' | 'number' | 'alphanumeric')}>
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
                                    value={props.formula || ''}
                                    onChange={(e) => updateProperty('formula', e.target.value)}
                                    placeholder="e.g., {field_a} + {field_b}"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Use the 'Field Key' from another column. You can find this by editing the column.
                                </p>
                            </div>
                            {props.inputFormat === 'number' && (
                                <div className="space-y-4 pt-2 border-t">
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor="fixed-length" className={cn(!!props.formula && 'text-muted-foreground')}>Fixed Digit Length</Label>
                                        <Input
                                            id="fixed-length"
                                            type="number"
                                            placeholder="e.g., 8"
                                            value={props.fixedLength || ''}
                                            onChange={(e) => updateProperty('fixedLength', e.target.value ? parseInt(e.target.value, 10) : undefined)}
                                            disabled={!!props.formula}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor="leading-char" className={cn(!!props.formula && 'text-muted-foreground')}>Leading Character (for padding)</Label>
                                        <Input
                                            id="leading-char"
                                            placeholder="e.g., 0"
                                            value={props.leadingChar || ''}
                                            onChange={(e) => updateProperty('leadingChar', e.target.value)}
                                            maxLength={1}
                                            disabled={!!props.formula}
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
                                      const newDataSource = val as 'static' | 'dynamic' | 'fromParent';
                                      updateMultipleProperties({
                                        dataSource: newDataSource,
                                        options: newDataSource === 'static' ? (props.options || ['Option 1']) : undefined,
                                        apiUrl: newDataSource === 'dynamic' ? (props.apiUrl || '') : undefined,
                                        valueKey: newDataSource !== 'static' ? props.valueKey : undefined,
                                        labelKey: newDataSource !== 'static' ? props.labelKey : undefined,
                                        dataSourceParentId: newDataSource === 'fromParent' || (newDataSource === 'dynamic' && props.apiUrl?.includes('{')) ? props.dataSourceParentId : undefined,
                                        dataSourceParentKey: newDataSource === 'fromParent' ? props.dataSourceParentKey : undefined,
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
                            {props.dataSource === 'dynamic' ? dynamicDataSourceFields() : 
                             props.dataSource === 'fromParent' ? parentDataSourceFields() : 
                             optionsField(props.options, (newOptions) => updateProperty('options', newOptions))}
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
                                        options: newDataSource === 'static' ? (props.options || ['Option 1']) : undefined,
                                        apiUrl: newDataSource === 'dynamic' ? (props.apiUrl || '') : undefined,
                                        valueKey: newDataSource === 'dynamic' ? props.valueKey : undefined,
                                        labelKey: newDataSource === 'dynamic' ? props.labelKey : undefined,
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
                 <Accordion type="multiple" defaultValue={["general", "data", "layout", "scoring"]} className="w-full">
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
                     <AccordionItem value="layout">
                        <AccordionTrigger className="py-2">Layout</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4">
                           <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                <Label htmlFor="hasSecondaryText">Add Secondary Text</Label>
                                <Switch id="hasSecondaryText" checked={props.hasSecondaryText} onCheckedChange={(checked) => updateMultipleProperties({ hasSecondaryText: checked, isSecondaryTextLink: checked ? props.isSecondaryTextLink : false })} />
                            </div>
                             {props.hasSecondaryText && (
                                <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                    <Label htmlFor="isSecondaryTextLink">Enable as Link</Label>
                                    <Switch id="isSecondaryTextLink" checked={props.isSecondaryTextLink} onCheckedChange={(checked) => updateProperty('isSecondaryTextLink', checked)} />
                                </div>
                            )}
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
                                        staticData: newDataSource === 'static' ? (props.staticData || [{ id: crypto.randomUUID(), label: "Option 1" }]) : undefined,
                                        apiUrl: newDataSource === 'dynamic' ? (props.apiUrl || '') : undefined,
                                        valueKey: newDataSource === 'dynamic' ? props.valueKey : 'id',
                                        labelKey: newDataSource === 'dynamic' ? props.labelKey : 'label',
                                        secondaryTextKey: newDataSource === 'dynamic' ? props.secondaryTextKey : 'secondaryText',
                                        linkUrlKey: newDataSource === 'dynamic' ? props.linkUrlKey : 'linkUrl',
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
                            {props.dataSource === 'dynamic' ? dynamicDataSourceFields() : staticDataEditor()}
                        </AccordionContent>
                    </AccordionItem>
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
                                </>
                            )}
                        </AccordionContent>
                    </AccordionItem>
                 </Accordion>
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
                        <AccordionContent className="flex flex-col gap-4">
                            {commonFields}
                            <div className="flex flex-col gap-2">
                                <Label>Validation</Label>
                                <Select value={props.dateValidation || 'all'} onValueChange={v => updateProperty('dateValidation', v)}>
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
                             {props.dateValidation === 'dateRange' && (
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor="range-from">From</Label>
                                        <Input 
                                            id="range-from" 
                                            type="date" 
                                            value={props.dateValidationRange?.from || ''}
                                            onChange={(e) => updateProperty('dateValidationRange', { ...props.dateValidationRange, from: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor="range-to">To</Label>
                                         <Input 
                                            id="range-to" 
                                            type="date" 
                                            value={props.dateValidationRange?.to || ''}
                                            onChange={(e) => updateProperty('dateValidationRange', { ...props.dateValidationRange, to: e.target.value })}
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
                <Accordion type="multiple" defaultValue={["general", "data", "columns", "features"]} className="w-full">
                    <AccordionItem value="general">
                        <AccordionTrigger className="py-2">General</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4">
                            {commonFields}
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="defaultRows" className={cn(props.allowUserToAddRows && 'text-muted-foreground')}>Default Rows</Label>
                                <Input
                                    id="defaultRows"
                                    type="number"
                                    min="0"
                                    value={props.defaultRows || 0}
                                    onChange={(e) => updateProperty('defaultRows', parseInt(e.target.value) >= 0 ? parseInt(e.target.value) : 0)}
                                    disabled={props.allowUserToAddRows}
                                />
                                {props.allowUserToAddRows && <p className="text-xs text-muted-foreground -mt-1">Disable "Allow User to Add Rows" to set default rows.</p>}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="data">
                        <AccordionTrigger className="py-2">API Data Binding (Labels)</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="apiUrl">API URL</Label>
                                <div className="flex gap-2">
                                    <Input id="apiUrl" value={props.apiUrl || ''} onChange={(e) => updateProperty('apiUrl', e.target.value)} />
                                    <Button onClick={() => handleFetchSchema(props.apiUrl, true)} disabled={isFetching} size="sm">
                                        {isFetching ? "Fetching..." : "Fetch"}
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">Fetch data to dynamically assign to column headers or field labels.</p>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="columns">
                        <AccordionTrigger className="py-2">Columns</AccordionTrigger>
                        <AccordionContent>
                            <ColumnManager
                                columns={props.columns || []}
                                onUpdate={(newColumns) => updateProperty('columns', newColumns)}
                                columnType="table"
                                parentFetchedData={fetchedJsonData}
                            />
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="features">
                        <AccordionTrigger className="py-2">Features</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4">
                            <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                <Label htmlFor="enable-search">Enable Search</Label>
                                <Switch id="enable-search" checked={props.enableSearch} onCheckedChange={(checked) => updateProperty('enableSearch', checked)} />
                            </div>
                             <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                    <Label htmlFor="allow-user-add-rows" className={cn((props.defaultRows || 0) > 0 && 'text-muted-foreground')}>Allow User to Add Rows</Label>
                                    <Switch 
                                        id="allow-user-add-rows" 
                                        checked={props.allowUserToAddRows} 
                                        onCheckedChange={(checked) => updateProperty('allowUserToAddRows', checked)}
                                        disabled={(props.defaultRows || 0) > 0}
                                    />
                                </div>
                                {(props.defaultRows || 0) > 0 && <p className="text-xs text-muted-foreground -mt-3 pl-3">Set "Default Rows" to 0 to enable this.</p>}
                            </div>
                            {props.allowUserToAddRows && (
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="maxRows">Max Rows</Label>
                                    <Input
                                        id="maxRows"
                                        type="number"
                                        min="1"
                                        placeholder="Unlimited"
                                        value={props.maxRows || ''}
                                        onChange={(e) => updateProperty('maxRows', e.target.value ? parseInt(e.target.value) : undefined)}
                                    />
                                </div>
                            )}
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
