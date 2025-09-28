

"use client";

import { useBuilder } from "@/hooks/use-builder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { X, Plus, icons, EyeOff, Eye, AlignStartVertical, AlignCenterVertical, AlignEndVertical, StretchVertical, Baseline, AlignStartHorizontal, AlignCenterHorizontal, AlignEndHorizontal, AlignHorizontalSpaceBetween, AlignHorizontalSpaceAround, Pilcrow, CaseSensitive } from "lucide-react";
import { ConditionalLogic, DisplayDataSourceConfig, FormElementInstance, PopupConfig, Section, TableColumn, TableColumnCellType } from "@/lib/types";
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
import { findFirstArray, flattenObject } from "@/lib/utils";


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

function ConditionalLogicSettings({
    element,
    onUpdate,
}: {
    element: Section | FormElementInstance;
    onUpdate: (logic: ConditionalLogic) => void;
}) {
    const { sections } = useBuilder();
    const logic = element.conditionalLogic || { enabled: false, triggerElementId: "", showWhenValue: "" };
    
    const allElements = sections.flatMap(s => {
        const elements: FormElementInstance[] = [];
        const findElementsRecursive = (els: FormElementInstance[]) => {
            for (const el of els) {
                elements.push(el);
                if (el.elements) {
                    findElementsRecursive(el.elements);
                }
            }
        }
        findElementsRecursive(s.elements);
        return elements;
    });

    const triggerElements = useMemo(() =>
        allElements.filter(e =>
            (e.type === 'RadioGroup' || e.type === 'Select' || e.type === 'Checkbox') && e.id !== element.id
        ), [allElements, element.id]
    );

    const selectedTrigger = triggerElements.find(el => el.id === logic.triggerElementId);
    
    const showValueDropdown = selectedTrigger && (selectedTrigger.type === 'RadioGroup' || (selectedTrigger.type === 'Select' && selectedTrigger.dataSource === 'static'));
    const triggerOptions: string[] = selectedTrigger?.options || [];

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                <Label htmlFor="enable-logic">Enable Conditional Logic</Label>
                <Switch
                    id="enable-logic"
                    checked={logic.enabled}
                    onCheckedChange={(checked) => onUpdate({ ...logic, enabled: checked })}
                />
            </div>
            {logic.enabled && (
                <>
                    <div className="flex flex-col gap-2">
                        <Label>Show this field when...</Label>
                        <Select
                            value={logic.triggerElementId}
                            onValueChange={(value) => onUpdate({ ...logic, triggerElementId: value, showWhenValue: '' })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a trigger field..." />
                            </SelectTrigger>
                            <SelectContent>
                                {triggerElements.map(el => (
                                    <SelectItem key={el.id} value={el.id}>{el.label} ({el.type})</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {selectedTrigger && (
                         <div className="flex flex-col gap-2">
                            <Label>...this value is selected:</Label>
                            {showValueDropdown ? (
                                <Select
                                    value={logic.showWhenValue}
                                    onValueChange={(value) => onUpdate({ ...logic, showWhenValue: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select an option..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {triggerOptions.map(opt => (
                                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <Input 
                                    placeholder="Enter expected value (e.g., 'true')"
                                    value={logic.showWhenValue}
                                    onChange={(e) => onUpdate({ ...logic, showWhenValue: e.target.value })}
                                />
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

function SectionProperties({ section }: { section: Section }) {
    const { dispatch } = useBuilder();
    
    const handleConditionalLogicUpdate = (logic: ConditionalLogic) => {
        dispatch({ type: "UPDATE_SECTION", payload: { ...section, conditionalLogic: logic } });
    }

    return (
        <div className="flex flex-col gap-4">
            <Accordion type="multiple" defaultValue={["general", "logic"]} className="w-full">
                <AccordionItem value="general">
                    <AccordionTrigger className="py-2">General</AccordionTrigger>
                    <AccordionContent className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="section-title">Title</Label>
                            <Input id="section-title" value={section.title} onChange={(e) => dispatch({ type: "UPDATE_SECTION", payload: { ...section, title: e.target.value } })} />
                        </div>
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="logic">
                    <AccordionTrigger className="py-2">Conditional Logic</AccordionTrigger>
                    <AccordionContent>
                        <ConditionalLogicSettings element={section} onUpdate={handleConditionalLogicUpdate} />
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

function ElementProperties({ element }: { element: FormElementInstance }) {
  const { dispatch, state, sections } = useBuilder();
  const { selectedElement } = state;
  const [props, setProps] = useState(element);
  const [fetchedKeys, setFetchedKeys] = useState<string[]>([]);
  const [isFetching, setIsFetching] = useState(false);


  const allElements = sections.flatMap(s => {
      const elements: FormElementInstance[] = [];
      const findElementsRecursive = (els: FormElementInstance[]) => {
          for (const el of els) {
              elements.push(el);
              if (el.elements) {
                  findElementsRecursive(el.elements);
              }
          }
      }
      findElementsRecursive(s.elements);
      return elements;
  });

  const dynamicSelects = useMemo(() =>
    allElements.filter(e => e.type === 'Select' && e.dataSource === 'dynamic' && e.id !== element.id)
    , [allElements, element.id]
  );

  useEffect(() => {
    setProps(element);
    if (element.type === 'Select' && element.dataSource === 'dynamic' && element.apiUrl) {
        handleFetchSchema();
    } else {
        setFetchedKeys([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [element]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (!selectedElement) return;

      const findAndDispatchUpdate = () => {
          for (const section of sections) {
              const findElementRecursive = (elements: FormElementInstance[], elementId: string): boolean => {
                  for (let i = 0; i < elements.length; i++) {
                      if (elements[i].id === elementId) {
                          dispatch({ type: "UPDATE_ELEMENT", payload: { sectionId: section.id, element: props }});
                          return true;
                      }
                      if (elements[i].type === 'Container' && elements[i].elements) {
                          if (findElementRecursive(elements[i].elements!, elementId)) return true;
                      }
                  }
                  return false;
              }
              if (findElementRecursive(section.elements, selectedElement.elementId)) return;
          }
      }
      findAndDispatchUpdate();

    }, 500);
    return () => clearTimeout(handler);
  }, [props, dispatch, selectedElement, sections]);

  const updateProperty = (key: keyof FormElementInstance, value: any) => {
    setProps(prev => ({...prev, [key]: value}));
  };

  const updateElement = (key: keyof FormElementInstance, value: any) => {
    if (!selectedElement) return;
    const newProps = { ...element, [key]: value };
    // If we're disabling conditional logic, clear the dependent fields
    if (key === 'conditionalLogic' && value.enabled === false) {
        newProps.conditionalLogic = { enabled: false, triggerElementId: '', showWhenValue: '' };
    }
     if (key === 'popup' && value.enabled === false) {
        newProps.popup = { enabled: false, title: '', description: '', icon: 'Info', iconColor: '#000000' };
    }
    dispatch({ type: "UPDATE_ELEMENT", payload: { sectionId: selectedElement.sectionId, element: newProps } });
  };
  
  if (!element) return null;

  const handleConditionalLogicUpdate = (logic: ConditionalLogic) => {
      updateElement('conditionalLogic', logic);
  }

  const handleDisplayDataSourceUpdate = (config: DisplayDataSourceConfig) => {
    updateElement('dataSourceConfig', config);
  }

  const handlePopupUpdate = (popup: PopupConfig) => {
    updateElement('popup', popup);
  }

  const handleFetchSchema = async () => {
    if (!element.apiUrl) {
        setFetchedKeys([]);
        return;
    };
    setIsFetching(true);
    try {
        const rawData = await fetchFromApi(element.apiUrl);
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
      <div className="flex flex-col gap-2">
        <Label htmlFor="key">Field Key</Label>
        <Input id="key" value={element.key} onChange={(e) => updateElement('key', e.target.value.replace(/\s+/g, '_').toLowerCase())} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="label">Label</Label>
        <Input id="label" value={element.label} onChange={(e) => updateElement('label', e.target.value)} />
      </div>
      <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
        <Label htmlFor="required">Required</Label>
        <Switch id="required" checked={element.required} onCheckedChange={(checked) => updateElement('required', checked)} />
      </div>
    </>
  );

  const placeholderField = (
    <div className="flex flex-col gap-2">
      <Label htmlFor="placeholder">Placeholder</Label>
      <Input id="placeholder" value={element.placeholder || ''} onChange={(e) => updateElement('placeholder', e.target.value)} />
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

  const tableFields = (
    <>
        <div className="flex flex-col gap-2">
            <Label>Columns</Label>
            {element.columns?.map((col, index) => (
                <div key={col.id} className="border p-3 rounded-lg space-y-3">
                    <div className="flex justify-between items-center">
                        <Label className="text-base">Column {index + 1}</Label>
                        <div className="flex items-center gap-2">
                             <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                                const newCols = [...element.columns!];
                                newCols[index].visible = !newCols[index].visible;
                                updateElement('columns', newCols);
                            }}>
                                {col.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                                const newCols = element.columns!.filter(c => c.id !== col.id);
                                updateElement('columns', newCols);
                            }}>
                                <X className="h-4 w-4 text-destructive" />
                            </Button>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor={`col-title-${col.id}`}>Title</Label>
                        <Input
                            id={`col-title-${col.id}`}
                            value={col.title}
                            onChange={(e) => {
                                const newCols = [...element.columns!];
                                newCols[index].title = e.target.value;
                                updateElement('columns', newCols);
                            }}
                        />
                    </div>
                     <div className="flex flex-col gap-2">
                        <Label htmlFor={`col-key-${col.id}`}>Key (for formulas)</Label>
                        <Input
                            id={`col-key-${col.id}`}
                            value={col.key}
                            onChange={(e) => {
                                const newCols = [...element.columns!];
                                newCols[index].key = e.target.value.replace(/\s+/g, '_').toLowerCase();
                                updateElement('columns', newCols);
                            }}
                        />
                    </div>
                     <div className="flex flex-col gap-2">
                        <Label>Cell Type</Label>
                        <Select
                            value={col.cellType || 'text'}
                            onValueChange={(value: TableColumnCellType) => {
                                const newCols = [...element.columns!];
                                newCols[index].cellType = value;
                                if ((value === 'select' || value === 'radio') && !newCols[index].options) {
                                    newCols[index].options = ['Option 1'];
                                }
                                updateElement('columns', newCols);
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select cell type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="text">Text</SelectItem>
                                <SelectItem value="select">Select</SelectItem>
                                <SelectItem value="checkbox">Checkbox</SelectItem>
                                <SelectItem value="radio">Radio</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {(col.cellType === 'select' || col.cellType === 'radio') && (
                        optionsField(col.options, (newOptions) => {
                             const newCols = [...element.columns!];
                             newCols[index].options = newOptions;
                             updateElement('columns', newCols);
                        })
                    )}
                    <div className="flex flex-col gap-2">
                        <Label htmlFor={`col-formula-${col.id}`}>Formula</Label>
                        <Input
                            id={`col-formula-${col.id}`}
                            placeholder="e.g., {quantity} * {price}"
                            value={col.formula || ''}
                            onChange={(e) => {
                                const newCols = [...element.columns!];
                                newCols[index].formula = e.target.value;
                                updateElement('columns', newCols);
                            }}
                        />
                         <p className="text-xs text-muted-foreground">Use column keys like {"{key1} * {key2}"}</p>
                    </div>
                </div>
            ))}
            <Button variant="outline" size="sm" className="mt-2" onClick={() => {
                const newKey = `col${(element.columns?.length || 0) + 1}`;
                const newCols = [...(element.columns || []), { id: crypto.randomUUID(), title: `Column ${ (element.columns?.length || 0) + 1}`, key: newKey, visible: true, cellType: 'text' }];
                updateElement('columns', newCols);
            }}>
                <Plus className="mr-2 h-4 w-4" />
                Add Column
            </Button>
        </div>
        <Separator />
         <div className="flex flex-col gap-2">
            <Label htmlFor="initialRows">Initial Rows</Label>
            <Input
                id="initialRows"
                type="number"
                value={element.initialRows || 1}
                onChange={(e) => updateElement('initialRows', parseInt(e.target.value, 10))}
                min={1}
            />
        </div>
        <Separator />
        <h4 className="font-medium">User Actions</h4>
        <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
            <Label htmlFor="allowAdd">Allow Add</Label>
            <Switch id="allowAdd" checked={element.allowAdd} onCheckedChange={(checked) => updateElement('allowAdd', checked)} />
        </div>
        <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
            <Label htmlFor="allowEdit">Allow Edit</Label>
            <Switch id="allowEdit" checked={element.allowEdit} onCheckedChange={(checked) => updateElement('allowEdit', checked)} />
        </div>
        <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
            <Label htmlFor="allowDelete">Allow Delete</Label>            <Switch id="allowDelete" checked={element.allowDelete} onCheckedChange={(checked) => updateElement('allowDelete', checked)} />
        </div>
    </>
  );
  
  const content = () => {
      switch(element.type) {
        case "Title":
            return (
                 <Accordion type="multiple" defaultValue={["general"]} className="w-full">
                    <AccordionItem value="general">
                        <AccordionTrigger className="py-2">General</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4">
                             <div className="flex flex-col gap-2">
                                <Label htmlFor="label">Title</Label>
                                <Input id="label" value={element.label} onChange={(e) => updateElement('label', e.target.value)} />
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                 </Accordion>
            );
        case "Separator":
            return <p className="text-sm text-muted-foreground">No properties for this element.</p>;
        case "Container":
             return (
                <Accordion type="multiple" defaultValue={["layout", "logic"]} className="w-full">
                    <AccordionItem value="layout">
                        <AccordionTrigger className="py-2">Layout</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4">
                           <div className="flex flex-col gap-2">
                                <Label>Direction</Label>
                                <RadioGroup
                                    value={element.direction}
                                    onValueChange={(value) => updateElement('direction', value as 'horizontal' | 'vertical')}
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
                                onValueChange={(value) => updateElement('justify', value)}
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
                                onValueChange={(value) => updateElement('align', value)}
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
                    <AccordionItem value="logic">
                        <AccordionTrigger className="py-2">Conditional Logic</AccordionTrigger>
                        <AccordionContent>
                            <ConditionalLogicSettings element={element} onUpdate={handleConditionalLogicUpdate} />
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
             )
        case "Display":
            const config = element.dataSourceConfig || { sourceElementId: "", displayKey: "" };
            return (
                 <Accordion type="multiple" defaultValue={["general", "data", "logic"]} className="w-full">
                    <AccordionItem value="general">
                        <AccordionTrigger className="py-2">General</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4">
                             <div className="flex flex-col gap-2">
                                <Label htmlFor="label">Label</Label>
                                <Input id="label" value={element.label} onChange={(e) => updateElement('label', e.target.value)} />
                            </div>
                            {placeholderField}
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="data">
                        <AccordionTrigger className="py-2">Data Source</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4">
                             <div className="flex flex-col gap-2">
                                <Label>Source Dropdown</Label>
                                <Select
                                    value={config.sourceElementId}
                                    onValueChange={(value) => handleDisplayDataSourceUpdate({ ...config, sourceElementId: value })}
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
                                    onChange={(e) => handleDisplayDataSourceUpdate({ ...config, displayKey: e.target.value })}
                                    placeholder="e.g., 'email' or 'address.city'"
                                />
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                     <AccordionItem value="logic">
                        <AccordionTrigger className="py-2">Conditional Logic</AccordionTrigger>
                        <AccordionContent>
                            <ConditionalLogicSettings element={element} onUpdate={handleConditionalLogicUpdate} />
                        </AccordionContent>
                    </AccordionItem>
                 </Accordion>
            );
        case "Input":
        case "Textarea":
        case "RichText":
             return (
                 <Accordion type="multiple" defaultValue={["general", "logic"]} className="w-full">
                    <AccordionItem value="general">
                        <AccordionTrigger className="py-2">General</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4">
                            {commonFields}
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="logic">
                        <AccordionTrigger className="py-2">Conditional Logic</AccordionTrigger>
                        <AccordionContent>
                            <ConditionalLogicSettings element={element} onUpdate={handleConditionalLogicUpdate} />
                        </AccordionContent>
                    </AccordionItem>
                 </Accordion>
            );
        case "Select":
            return (
                <Accordion type="multiple" defaultValue={["general", "data", "logic"]} className="w-full">
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
                                    defaultValue={element.dataSource || 'static'}
                                    onValueChange={(val) => {
                                    const newProps = {...element, dataSource: val as 'static' | 'dynamic'};
                                    if (val === 'static' && !newProps.options) {
                                        newProps.options = ['Option 1'];
                                    }
                                    if (!selectedElement) return;
                                    dispatch({ type: "UPDATE_ELEMENT", payload: { sectionId: selectedElement.sectionId, element: newProps } });
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
                            {element.dataSource === 'dynamic' ? dynamicDataSourceFields : optionsField(element.options, (newOptions) => updateElement('options', newOptions))}
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="logic">
                        <AccordionTrigger className="py-2">Conditional Logic</AccordionTrigger>
                        <AccordionContent>
                            <ConditionalLogicSettings element={element} onUpdate={handleConditionalLogicUpdate} />
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            );
        case "RadioGroup":
             return (
                 <Accordion type="multiple" defaultValue={["general", "data", "logic"]} className="w-full">
                    <AccordionItem value="general">
                        <AccordionTrigger className="py-2">General</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4">
                            {commonFields}
                            <PopupSettings element={element} onUpdate={handlePopupUpdate} />
                        </AccordionContent>
                    </AccordionItem>
                     <AccordionItem value="data">
                        <AccordionTrigger className="py-2">Options</AccordionTrigger>
                        <AccordionContent>
                            {optionsField(element.options, (newOptions) => updateElement('options', newOptions))}
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="logic">
                        <AccordionTrigger className="py-2">Conditional Logic</AccordionTrigger>
                        <AccordionContent>
                            <ConditionalLogicSettings element={element} onUpdate={handleConditionalLogicUpdate} />
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
             );
        case "Checkbox":
            return (
                 <Accordion type="multiple" defaultValue={["general", "logic"]} className="w-full">
                    <AccordionItem value="general">
                        <AccordionTrigger className="py-2">General</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="key">Field Key</Label>
                                <Input id="key" value={element.key} onChange={(e) => updateElement('key', e.target.value.replace(/\s+/g, '_').toLowerCase())} />
                            </div>
                            <div className="flex flex-col gap-2 mt-[6px]">
                                <Label htmlFor="label">Label</Label>
                                <Input id="label" value={element.label} onChange={(e) => updateElement('label', e.target.value)} />
                            </div>
                            <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                <Label htmlFor="required">Required</Label>
                                <Switch id="required" checked={element.required} onCheckedChange={(checked) => updateElement('required', checked)} />
                            </div>
                            <PopupSettings element={element} onUpdate={handlePopupUpdate} />
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="logic">
                        <AccordionTrigger className="py-2">Conditional Logic</AccordionTrigger>
                        <AccordionContent>
                            <ConditionalLogicSettings element={element} onUpdate={handleConditionalLogicUpdate} />
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            );
        case "DatePicker":
            return (
                 <Accordion type="multiple" defaultValue={["general", "logic"]} className="w-full">
                    <AccordionItem value="general">
                        <AccordionTrigger className="py-2">General</AccordionTrigger>
                        <AccordionContent>
                            {commonFields}
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="logic">
                        <AccordionTrigger className="py-2">Conditional Logic</AccordionTrigger>
                        <AccordionContent>
                           <ConditionalLogicSettings element={element} onUpdate={handleConditionalLogicUpdate} />
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            );
        case "Table":
            return (
                <Accordion type="multiple" defaultValue={["general", "columns", "actions", "logic"]} className="w-full">
                    <AccordionItem value="general">
                        <AccordionTrigger className="py-2">General</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4">
                            {commonFields}
                        </AccordionContent>
                    </AccordionItem>
                     <AccordionItem value="columns">
                        <AccordionTrigger className="py-2">Columns</AccordionTrigger>
                        <AccordionContent>
                            {tableFields}
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="logic">
                        <AccordionTrigger className="py-2">Conditional Logic</AccordionTrigger>
                        <AccordionContent>
                           <ConditionalLogicSettings element={element} onUpdate={handleConditionalLogicUpdate} />
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
