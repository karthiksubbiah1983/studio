

"use client";

import { useBuilder } from "@/hooks/use-builder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { X, Plus, icons, EyeOff, Eye, AlignStartVertical, AlignCenterVertical, AlignEndVertical, StretchVertical, Baseline, AlignStartHorizontal, AlignCenterHorizontal, AlignEndHorizontal, AlignHorizontalSpaceBetween, AlignHorizontalSpaceAround, Pilcrow, CaseSensitive, Palette, GitCommitHorizontal, Link2, Settings2, Edit, Trash } from "lucide-react";
import { FormElementInstance, PopupConfig, Section, Rule, Condition, RuleBehaviorType, ElementType, DataGridColumn, TableColumn } from "@/lib/types";
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
    if (!selected) return null;
    if ('type' in selected) {
        return selected.type;
    }
    return "Section";
  }

  return (
    <div className="w-full p-4 overflow-y-auto h-full text-sm">
      <div className="flex justify-between items-center mb-2">
        <p className="text-base font-bold text-foreground">
            {getSelectedElementName() || 'Properties'}
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
            <Accordion type="multiple" defaultValue={["general"]} className="w-full">
                <AccordionItem value="general">
                    <AccordionTrigger className="py-2">General</AccordionTrigger>
                    <AccordionContent className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="section-title">Title</Label>
                            <Input id="section-title" value={section.title} onChange={(e) => dispatch({ type: "UPDATE_SECTION", payload: { ...section, title: e.target.value } })} />
                        </div>
                         <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                            <Label htmlFor="hidden-by-default">Hidden by default</Label>
                            <Switch id="hidden-by-default" checked={!!section.hidden} onCheckedChange={(checked) => dispatch({ type: "UPDATE_SECTION", payload: { ...section, hidden: checked } })} />
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

function ElementProperties({ element, onUpdate: onUpdateProp, isColumnElement = false }: { element: FormElementInstance, onUpdate?: (element: FormElementInstance) => void, isColumnElement?: boolean }) {
  const { dispatch, state, sections } = useBuilder();
  const [props, setProps] = useState(element);
  const { selectedElement } = state;
  const [fetchedKeys, setFetchedKeys] = useState<string[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [editingColumn, setEditingColumn] = useState<TableColumn | null>(null);

  const allElements = getAllElements(sections);

  const dynamicSelects = useMemo(() =>
    allElements.filter(e => e.type === 'Select' && e.dataSource === 'dynamic' && e.id !== element.id)
    , [allElements, element.id]
  );

  useEffect(() => {
    setProps(element);
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

  const handleApiUrlChange = (newUrl: string) => {
    const newProps = { 
        ...props,
        apiUrl: newUrl,
        valueKey: undefined,
        labelKey: undefined
    };
    setProps(newProps);
    onUpdate(newProps);
    setFetchedKeys([]);
  }

  const handleFetchSchema = async () => {
    if (!props.apiUrl) {
        setFetchedKeys([]);
        return;
    };
    setIsFetching(true);
    try {
        const rawData = await fetchFromApi(props.apiUrl);
        if (rawData) {
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
  
  const handleUpdateColumn = (updatedColumn: TableColumn) => {
    if (!props.tableColumns) return;
    const newColumns = props.tableColumns.map(c => c.id === updatedColumn.id ? updatedColumn : c);
    updateProperty('tableColumns', newColumns);
    setEditingColumn(updatedColumn);
  }

  const commonFields = (
    <>
      {!isColumnElement && <div className="flex flex-col gap-2">
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
        <Label htmlFor="hidden-by-default">Hidden by default</Label>
        <Switch id="hidden-by-default" checked={!!props.hidden} onCheckedChange={(checked) => updateProperty('hidden', checked)} />
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

  const dynamicDataSourceFields = (
    <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
            <Label htmlFor="apiUrl">API URL</Label>
            <div className="flex gap-2">
                <Input id="apiUrl" value={props.apiUrl || ''} onChange={(e) => handleApiUrlChange(e.target.value)} />
                <Button onClick={handleFetchSchema} disabled={isFetching} size="sm">
                    {isFetching ? "Fetching..." : "Fetch"}
                </Button>
            </div>
        </div>

        {fetchedKeys.length > 0 && (
             <>
                <div className="flex flex-col gap-2">
                    <Label htmlFor="valueKey">Option Value Key</Label>
                    <Select value={props.valueKey} onValueChange={(v) => updateProperty('valueKey', v)}>
                        <SelectTrigger><SelectValue placeholder="Select value key..."/></SelectTrigger>
                        <SelectContent>
                            {fetchedKeys.map(key => <SelectItem key={key} value={key}>{key}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex flex-col gap-2">
                    <Label htmlFor="labelKey">Option Label Key</Label>
                     <Select value={props.labelKey} onValueChange={(v) => updateProperty('labelKey', v)}>
                        <SelectTrigger><SelectValue placeholder="Select label key..."/></SelectTrigger>
                        <SelectContent>
                            {fetchedKeys.map(key => <SelectItem key={key} value={key}>{key}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </>
        )}
    </div>
  );

  const dataGridColumnsField = (columns: DataGridColumn[] | undefined, onUpdate: (columns: DataGridColumn[]) => void) => (
    <div className="flex flex-col gap-2">
        <Label>Columns</Label>
        {columns?.map((col, index) => (
            <div key={col.id} className="flex items-end gap-2 p-2 border rounded-md">
                <div className="flex-1 grid gap-2">
                    <div className="space-y-1">
                        <Label htmlFor={`col-label-${col.id}`} className="text-xs">Column Label</Label>
                        <Input 
                            id={`col-label-${col.id}`}
                            placeholder="e.g., User Name"
                            value={col.label}
                            onChange={(e) => {
                                const newCols = [...columns];
                                newCols[index].label = e.target.value;
                                onUpdate(newCols);
                            }}
                        />
                    </div>
                     <div className="space-y-1">
                        <Label htmlFor={`col-key-${col.id}`} className="text-xs">Data Key</Label>
                        {fetchedKeys.length > 0 ? (
                            <Select
                                value={col.key}
                                onValueChange={(value) => {
                                    const newCols = [...columns];
                                    newCols[index].key = value;
                                    onUpdate(newCols);
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select data key..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {fetchedKeys.map(key => (
                                        <SelectItem key={key} value={key}>{key}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        ) : (
                            <Input 
                                id={`col-key-${col.id}`}
                                placeholder="e.g., user.name"
                                value={col.key}
                                onChange={(e) => {
                                    const newCols = [...columns];
                                    newCols[index].key = e.target.value;
                                    onUpdate(newCols);
                                }}
                            />
                        )}
                    </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => {
                    const newCols = columns.filter((_, i) => i !== index);
                    onUpdate(newCols);
                }}>
                    <X className="h-4 w-4" />
                </Button>
            </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => {
            const newCols = [...(columns || []), { id: crypto.randomUUID(), key: "", label: `Column ${(columns?.length || 0) + 1}` }];
            onUpdate(newCols);
        }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Column
        </Button>
    </div>
  );
  
  const content = () => {
      switch(props.type) {
        case "Title":
            return (
                 <Accordion type="multiple" defaultValue={["general"]} className="w-full">
                    <AccordionItem value="general">
                        <AccordionTrigger className="py-2">General</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4">
                             <div className="flex flex-col gap-2">
                                <Label htmlFor="label">Title</Label>
                                <Input id="label" value={props.label} onChange={(e) => updateProperty('label', e.target.value)} />
                            </div>
                            <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                <Label htmlFor="hidden-by-default">Hidden by default</Label>
                                <Switch id="hidden-by-default" checked={!!props.hidden} onCheckedChange={(checked) => updateProperty('hidden', checked)} />
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                 </Accordion>
            );
        case "Separator":
            return (
                <Accordion type="multiple" defaultValue={["general"]} className="w-full">
                    <AccordionItem value="general">
                        <AccordionTrigger className="py-2">General</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4">
                             <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                <Label htmlFor="hidden-by-default">Hidden by default</Label>
                                <Switch id="hidden-by-default" checked={!!props.hidden} onCheckedChange={(checked) => updateProperty('hidden', checked)} />
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
                            <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                <Label htmlFor="hidden-by-default">Hidden by default</Label>
                                <Switch id="hidden-by-default" checked={!!props.hidden} onCheckedChange={(checked) => updateProperty('hidden', checked)} />
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
            const config = props.dataSourceConfig || { sourceElementId: "", displayKey: "" };
            return (
                 <Accordion type="multiple" defaultValue={["general", "data"]} className="w-full">
                    <AccordionItem value="general">
                        <AccordionTrigger className="py-2">General</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4">
                             <div className="flex flex-col gap-2">
                                <Label htmlFor="label">Label</Label>
                                <Input id="label" value={props.label} onChange={(e) => updateProperty('label', e.target.value)} />
                            </div>
                            {placeholderField}
                            <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                <Label htmlFor="hidden-by-default">Hidden by default</Label>
                                <Switch id="hidden-by-default" checked={!!props.hidden} onCheckedChange={(checked) => updateProperty('hidden', checked)} />
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="data">
                        <AccordionTrigger className="py-2">Data Source</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4">
                             <div className="flex flex-col gap-2">
                                <Label>Source Dropdown</Label>
                                <Select
                                    value={config.sourceElementId}
                                    onValueChange={(value) => updateProperty('dataSourceConfig', { ...config, sourceElementId: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a dropdown..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {dynamicSelects.map(sel => (
                                            <SelectItem key={sel.id} value={sel.id}>{sel.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="display-key">Display Key</Label>
                                <Input 
                                    id="display-key" 
                                    value={config.displayKey}
                                    onChange={(e) => updateProperty('dataSourceConfig', { ...config, displayKey: e.target.value })}
                                    placeholder="e.g., 'email' or 'address.city'"
                                />
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                 </Accordion>
            );
        case "Input":
        case "Textarea":
        case "RichText":
             return (
                 <Accordion type="multiple" defaultValue={["general"]} className="w-full">
                    <AccordionItem value="general">
                        <AccordionTrigger className="py-2">General</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4">
                            {commonFields}
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
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="data">
                        <AccordionTrigger className="py-2">Data Source</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4">
                             <div className="flex flex-col gap-2 mb-1.5">
                                <Label>Source Type</Label>
                                <RadioGroup
                                    defaultValue={props.dataSource || 'static'}
                                    onValueChange={(val) => {
                                      const newDataSource = val as 'static' | 'dynamic';
                                      const newOptions = (newDataSource === 'static' && !props.options) ? ['Option 1'] : props.options;
                                      updateProperty('dataSource', newDataSource);
                                      if (newDataSource === 'static') {
                                        updateProperty('options', newOptions);
                                      }
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
                            {props.dataSource === 'dynamic' ? dynamicDataSourceFields : optionsField(props.options, (newOptions) => updateProperty('options', newOptions))}
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            );
        case "DataGrid":
            return (
                 <Accordion type="multiple" defaultValue={["general", "data", "columns", "pagination"]} className="w-full">
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
                                <Label htmlFor="apiUrl">API URL</Label>
                                <div className="flex gap-2">
                                    <Input id="apiUrl" value={props.apiUrl || ''} onChange={(e) => handleApiUrlChange(e.target.value)} />
                                     <Button onClick={handleFetchSchema} disabled={isFetching} size="sm">
                                        {isFetching ? "Fetching..." : "Fetch"}
                                    </Button>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="columns">
                        <AccordionTrigger className="py-2">Columns</AccordionTrigger>
                        <AccordionContent>
                            {dataGridColumnsField(props.columns, (newColumns) => updateProperty('columns', newColumns))}
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="pagination">
                        <AccordionTrigger className="py-2">Pagination</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4">
                           <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                <Label htmlFor="pagination-enabled">Enable Pagination</Label>
                                <Switch id="pagination-enabled" checked={props.paginationEnabled} onCheckedChange={(checked) => updateProperty('paginationEnabled', checked)} />
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
            )
        case "Table":
            return (
                <>
                <Accordion type="multiple" defaultValue={["general", "columns", "rows"]} className="w-full">
                    <AccordionItem value="general">
                        <AccordionTrigger className="py-2">General</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4">
                            {commonFields}
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="columns">
                        <AccordionTrigger className="py-2">Columns</AccordionTrigger>
                        <AccordionContent>
                            <div className="flex flex-col gap-2">
                                <Label>Columns</Label>
                                {props.tableColumns?.map((col, index) => (
                                    <div key={col.id} className="flex items-center gap-2 p-2 border rounded-md">
                                        <div className="flex-1 text-sm">{col.label} ({col.element.type})</div>
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingColumn(col)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                                            const newCols = props.tableColumns?.filter(c => c.id !== col.id);
                                            updateProperty('tableColumns', newCols);
                                        }}>
                                            <Trash className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                ))}
                                <Button variant="outline" size="sm" onClick={() => {
                                    const newCol: TableColumn = {
                                        id: crypto.randomUUID(),
                                        key: `col_${(props.tableColumns?.length || 0) + 1}`,
                                        label: `Column ${(props.tableColumns?.length || 0) + 1}`,
                                        element: createNewElement('Input')
                                    };
                                    setEditingColumn(newCol); // Open dialog to configure new column
                                }}>
                                    <Plus className="mr-2 h-4 w-4" /> Add Column
                                </Button>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="rows">
                        <AccordionTrigger className="py-2">Rows</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4">
                            <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                <Label htmlFor="can-add-rows">User can add rows</Label>
                                <Switch id="can-add-rows" checked={props.canAddRows} onCheckedChange={(checked) => updateProperty('canAddRows', checked)} />
                            </div>
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
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>

                <Dialog open={!!editingColumn} onOpenChange={(isOpen) => !isOpen && setEditingColumn(null)}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Edit Column</DialogTitle>
                            <DialogDescription>
                                Configure the properties for this table column.
                            </DialogDescription>
                        </DialogHeader>
                        {editingColumn && (
                            <div className="py-4 flex flex-col gap-4">
                                <div className="flex flex-col gap-2">
                                    <Label>Column Header</Label>
                                    <Input value={editingColumn.label} onChange={(e) => setEditingColumn({...editingColumn, label: e.target.value })} />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label>Column Key</Label>
                                    <Input value={editingColumn.key} onChange={(e) => setEditingColumn({...editingColumn, key: e.target.value.replace(/\s+/g, '_').toLowerCase() })} />
                                </div>

                                <Separator />

                                <div className="flex flex-col gap-2">
                                    <Label>Formula (Optional)</Label>
                                    <Input 
                                        placeholder="e.g. {col_1} * {col_2}"
                                        value={editingColumn.formula || ''}
                                        onChange={(e) => setEditingColumn({ ...editingColumn, formula: e.target.value })}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        If a formula is provided, this column will be read-only and calculated automatically. Use {'{column_key}'} to reference other columns.
                                    </p>
                                </div>
                                
                                {!(editingColumn.formula) && (
                                    <>
                                        <Separator />
                                        <h3 className="text-lg font-medium">Field Properties</h3>
                                        <div className="flex flex-col gap-2">
                                            <Label>Field Type</Label>
                                            <Select 
                                                value={editingColumn.element.type}
                                                onValueChange={(type) => {
                                                    const newElement = createNewElement(type as ElementType);
                                                    setEditingColumn({...editingColumn, element: newElement });
                                                }}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a field type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Input">Input</SelectItem>
                                                    <SelectItem value="Select">Select</SelectItem>
                                                    <SelectItem value="Checkbox">Checkbox</SelectItem>
                                                    <SelectItem value="RadioGroup">Radio Group</SelectItem>
                                                    <SelectItem value="DatePicker">Date Picker</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        
                                        <ElementProperties
                                            element={editingColumn.element}
                                            onUpdate={(updatedElement) => setEditingColumn({ ...editingColumn, element: updatedElement })}
                                            isColumnElement={true}
                                        />
                                    </>
                                )}
                            </div>
                        )}
                        <DialogFooter>
                             <Button variant="outline" onClick={() => setEditingColumn(null)}>Cancel</Button>
                             <Button onClick={() => {
                                if (!editingColumn) return;
                                const existing = props.tableColumns?.find(c => c.id === editingColumn.id);
                                let newColumns: TableColumn[];
                                if (existing) {
                                    newColumns = (props.tableColumns || []).map(c => c.id === editingColumn.id ? editingColumn : c);
                                } else {
                                    newColumns = [...(props.tableColumns || []), editingColumn];
                                }
                                updateProperty('tableColumns', newColumns);
                                setEditingColumn(null);
                             }}>Save Column</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                </>
            );
        case "RadioGroup":
             return (
                 <Accordion type="multiple" defaultValue={["general", "data"]} className="w-full">
                    <AccordionItem value="general">
                        <AccordionTrigger className="py-2">General</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4">
                            {commonFields}
                            <PopupSettings element={props} onUpdate={(popup) => updateProperty('popup', popup)} />
                        </AccordionContent>
                    </AccordionItem>
                     <AccordionItem value="data">
                        <AccordionTrigger className="py-2">Options</AccordionTrigger>
                        <AccordionContent>
                            {optionsField(props.options, (newOptions) => updateProperty('options', newOptions))}
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
                                <Label htmlFor="hidden-by-default">Hidden by default</Label>
                                <Switch id="hidden-by-default" checked={!!props.hidden} onCheckedChange={(checked) => updateProperty('hidden', checked)} />
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
        default:
            return null;
      }
  }

  return (
    <div className="flex flex-col gap-4">
      {content()}
    </div>
  );
}



    