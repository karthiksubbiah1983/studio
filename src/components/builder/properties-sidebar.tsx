

"use client";

import { useBuilder } from "@/hooks/use-builder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { X, Plus, icons, EyeOff, Eye, AlignStartVertical, AlignCenterVertical, AlignEndVertical, StretchVertical, Baseline, AlignStartHorizontal, AlignCenterHorizontal, AlignEndHorizontal, AlignHorizontalSpaceBetween, AlignHorizontalSpaceAround, Pilcrow, CaseSensitive, Palette, GitCommitHorizontal, Link2, Settings2, Edit } from "lucide-react";
import { FormElementInstance, PopupConfig, Section, DataGridColumn, InputTableColumn, Rule, Condition, RuleBehaviorType, ElementType } from "@/lib/types";
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

function InputTableColumnEditor({ 
    column,
    onUpdate,
    onDelete,
}: {
    column: InputTableColumn;
    onUpdate: (updatedColumn: InputTableColumn) => void;
    onDelete: () => void;
}) {
    const [isElementEditorOpen, setIsElementEditorOpen] = useState(false);
    
    return (
        <div className="border p-3 rounded-lg space-y-3 bg-card">
            <div className="flex justify-between items-center">
                <Label className="text-base">{column.title || 'Column'}</Label>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDelete}>
                    <X className="h-4 w-4 text-destructive" />
                </Button>
            </div>
            <div className="flex flex-col gap-2">
                <Label htmlFor={`col-title-${column.id}`}>Title</Label>
                <Input
                    id={`col-title-${column.id}`}
                    value={column.title}
                    onChange={(e) => onUpdate({ ...column, title: e.target.value })}
                />
            </div>
            <div className="flex flex-col gap-2">
                <Label htmlFor={`col-key-${column.id}`}>Key</Label>
                <Input
                    id={`col-key-${column.id}`}
                    value={column.key}
                    onChange={(e) => onUpdate({ ...column, key: e.target.value.replace(/\s+/g, '_').toLowerCase() })}
                />
            </div>
             <div className="flex flex-col gap-2">
                <Label htmlFor={`col-width-${column.id}`}>Width</Label>
                <Input
                    id={`col-width-${column.id}`}
                    value={column.width || ''}
                    placeholder="e.g. 150px"
                    onChange={(e) => onUpdate({ ...column, width: e.target.value })}
                />
            </div>
            <div className="flex flex-col gap-2">
                <Label>Contained Element</Label>
                <div className="border rounded-md p-2 flex justify-between items-center">
                    <p className="text-sm font-mono bg-muted px-2 py-1 rounded">{column.element.type}</p>
                    <Button variant="outline" size="sm" onClick={() => setIsElementEditorOpen(true)}>
                        <Edit className="mr-2 h-3 w-3" /> Edit
                    </Button>
                </div>
            </div>

            {isElementEditorOpen && (
                 <Dialog open={isElementEditorOpen} onOpenChange={setIsElementEditorOpen}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Editing Column: {column.title}</DialogTitle>
                            <DialogDescription>
                                Configure the form element for this column. Changes here will not affect the column's Title or Key.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4 max-h-[60vh] overflow-y-auto px-1">
                            <ElementProperties 
                                element={column.element}
                                onUpdate={(updatedElement) => onUpdate({ ...column, element: updatedElement })}
                                isColumnElement={true}
                            />
                        </div>
                        <DialogFooter>
                            <Button onClick={() => setIsElementEditorOpen(false)}>Done</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}

function ElementProperties({ element, onUpdate: onUpdateProp, isColumnElement = false }: { element: FormElementInstance, onUpdate?: (element: FormElementInstance) => void, isColumnElement?: boolean }) {
  const { dispatch, state, sections } = useBuilder();
  const [props, setProps] = useState(element);
  const { selectedElement } = state;
  const [fetchedKeys, setFetchedKeys] = useState<string[]>([]);
  const [isFetching, setIsFetching] = useState(false);

  const [editingColumn, setEditingColumn] = useState<InputTableColumn | null>(null);

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
                <Input id="apiUrl" value={props.apiUrl || ''} onChange={(e) => updateProperty('apiUrl', e.target.value)} />
                <Button onClick={handleFetchSchema} disabled={isFetching} size="sm">
                    {isFetching ? "Fetching..." : "Fetch Schema"}
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
        case "DataGrid":
            return (
                <Accordion type="multiple" defaultValue={['general', 'data', 'columns']} className="w-full">
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
                                    <Input id="apiUrl" value={props.apiUrl || ''} onChange={(e) => updateProperty('apiUrl', e.target.value)} />
                                    <Button onClick={handleFetchSchema} disabled={isFetching} size="sm">
                                        {isFetching ? "Fetching..." : "Fetch Schema"}
                                    </Button>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="columns">
                        <AccordionTrigger className="py-2">Columns</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-2">
                            {props.columns?.map((col, index) => (
                                <div key={col.id} className="border p-3 rounded-lg space-y-3">
                                    <div className="flex justify-between items-center">
                                        <Label className="text-base">{col.title || `Column ${index + 1}`}</Label>
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                                            const newCols = props.columns!.filter(c => c.id !== col.id);
                                            updateProperty('columns', newCols);
                                        }}>
                                            <X className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor={`col-title-${col.id}`}>Title</Label>
                                        <Input id={`col-title-${col.id}`} value={col.title} onChange={(e) => {
                                            const newCols = [...props.columns!];
                                            newCols[index].title = e.target.value;
                                            updateProperty('columns', newCols);
                                        }}/>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor={`col-dataKey-${col.id}`}>Data Key</Label>
                                        <Select value={col.dataKey} onValueChange={(value) => {
                                            const newCols = [...props.columns!];
                                            newCols[index].dataKey = value;
                                            updateProperty('columns', newCols);
                                        }}>
                                            <SelectTrigger><SelectValue placeholder="Select a data key..."/></SelectTrigger>
                                            <SelectContent>
                                                {fetchedKeys.length > 0 ? (
                                                    fetchedKeys.map(key => <SelectItem key={key} value={key}>{key}</SelectItem>)
                                                ) : (
                                                    <SelectItem value={col.dataKey} disabled>{col.dataKey || "No keys available"}</SelectItem>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                        <Label htmlFor={`col-visible-${col.id}`}>Visible by default</Label>
                                        <Switch id={`col-visible-${col.id}`} checked={col.visible} onCheckedChange={(checked) => {
                                            const newCols = [...props.columns!];
                                            newCols[index].visible = checked;
                                            updateProperty('columns', newCols);
                                        }} />
                                    </div>
                                </div>
                            ))}
                            <Button variant="outline" size="sm" className="mt-2" onClick={() => {
                                const newCols = [...(props.columns || []), { id: crypto.randomUUID(), title: `Column ${(props.columns?.length || 0) + 1}`, dataKey: "", key: `col${(props.columns?.length || 0) + 1}`, visible: true }];
                                updateProperty('columns', newCols);
                            }}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Column
                            </Button>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            );
         case "InputTable":
            return (
                 <Accordion type="multiple" defaultValue={['general', 'columns', 'config']} className="w-full">
                    <AccordionItem value="general">
                        <AccordionTrigger className="py-2">General</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4">
                            {commonFields}
                        </AccordionContent>
                    </AccordionItem>
                     <AccordionItem value="columns">
                        <AccordionTrigger className="py-2">Columns</AccordionTrigger>
                        <AccordionContent className="space-y-2">
                           {props.inputColumns?.map((col, index) => (
                                <InputTableColumnEditor 
                                    key={col.id} 
                                    column={col}
                                    onUpdate={(updatedColumn) => {
                                        const newCols = [...props.inputColumns!];
                                        newCols[index] = updatedColumn;
                                        updateProperty('inputColumns', newCols);
                                    }}
                                    onDelete={() => {
                                        const newCols = props.inputColumns!.filter(c => c.id !== col.id);
                                        updateProperty('inputColumns', newCols);
                                    }}
                                />
                           ))}
                           <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => {
                                const newCol: InputTableColumn = {
                                    id: crypto.randomUUID(),
                                    title: `Column ${(props.inputColumns?.length || 0) + 1}`,
                                    key: `col${(props.inputColumns?.length || 0) + 1}`,
                                    element: createNewElement('Input'),
                                };
                                const newCols = [...(props.inputColumns || []), newCol];
                                updateProperty('inputColumns', newCols);
                           }}>
                               <Plus className="mr-2 h-4 w-4" />
                                Add Column
                           </Button>
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="config">
                        <AccordionTrigger className="py-2">Configuration</AccordionTrigger>
                        <AccordionContent className="space-y-4">
                             <div className="flex flex-col gap-2">
                                <Label htmlFor="initialRows">Initial Rows</Label>
                                <Input
                                    id="initialRows"
                                    type="number"
                                    value={props.initialRows || 1}
                                    onChange={(e) => updateProperty('initialRows', parseInt(e.target.value, 10))}
                                    min={1}
                                />
                            </div>
                            <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                <Label htmlFor="allowAdd">Allow Add Rows</Label>
                                <Switch id="allowAdd" checked={!!props.allowAdd} onCheckedChange={(checked) => updateProperty('allowAdd', checked)} />
                            </div>
                            <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                <Label htmlFor="allowDelete">Allow Delete Rows</Label>
                                <Switch id="allowDelete" checked={!!props.allowDelete} onCheckedChange={(checked) => updateProperty('allowDelete', checked)} />
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            )
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
