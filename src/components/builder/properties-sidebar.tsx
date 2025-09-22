"use client";

import { useBuilder } from "@/hooks/use-builder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { X, Plus, Loader2, icons, EyeOff, Eye } from "lucide-react";
import { ConditionalLogic, DisplayDataSourceConfig, FormElementInstance, PopupConfig, Section, TableColumn } from "@/lib/types";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useEffect, useMemo, useState } from "react";
import { suggestElementsAction } from "@/actions/suggest-elements";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export function PropertiesSidebar() {
  const { state, dispatch } = useBuilder();
  const { selectedElement } = state;

  const getSelectedElementInstance = () => {
    if (!selectedElement) return null;
    const section = state.sections.find(s => s.id === selectedElement.sectionId);
    if (!section) return null;
    if (selectedElement.elementId) {
        return section.elements.find(e => e.id === selectedElement.elementId) || null;
    }
    return section;
  };

  const selected = getSelectedElementInstance();

  return (
    <div className="w-full p-4 overflow-y-auto h-full">
      <div className="flex justify-between items-center">
        <p className="text-sm text-foreground/70">Properties</p>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => dispatch({ type: "SELECT_ELEMENT", payload: null })}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <Separator className="my-2" />
      {!selected && <p className="text-sm text-muted-foreground">Select an element to see its properties.</p>}
      {selected && 'elements' in selected && <SectionProperties section={selected} />}
      {selected && 'type' in selected && <ElementProperties element={selected} />}
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
    const { state } = useBuilder();
    const logic = element.conditionalLogic || { enabled: false, triggerElementId: "", showWhenValue: "" };

    const triggerElements = useMemo(() =>
        state.sections.flatMap(s =>
            s.elements.filter(e =>
                (e.type === 'RadioGroup' || (e.type === 'Select' && e.dataSource === 'static') || e.type === 'Checkbox') && e.id !== element.id
            )
        ), [state.sections, element.id]
    );

    const selectedTrigger = triggerElements.find(el => el.id === logic.triggerElementId);
    
    let triggerOptions: string[] = [];
    if (selectedTrigger) {
        if (selectedTrigger.type === 'Checkbox') {
            triggerOptions = ['true', 'false'];
        } else if (selectedTrigger.options) {
            triggerOptions = selectedTrigger.options;
        }
    }

    return (
        <div className="flex flex-col gap-4">
            <Separator />
            <h4 className="font-medium">Conditional Logic</h4>
            <div className="flex items-center justify-between rounded-lg p-3 shadow-sm">
                <Label htmlFor="enable-logic">Enable</Label>
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
                            <Label>...this option is selected:</Label>
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
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

function SectionProperties({ section }: { section: Section }) {
    const { dispatch } = useBuilder();
    const { toast } = useToast();
    const [title, setTitle] = useState(section.title);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setTitle(section.title);
    }, [section.title]);

    useEffect(() => {
        const handler = setTimeout(async () => {
          if (title === section.title || title.trim().length < 3) return;
          
          dispatch({ type: "UPDATE_SECTION", payload: { ...section, title } });
          
          setIsLoading(true);
          try {
            const res = await suggestElementsAction({ sectionTitle: title });
            setSuggestions(res.suggestedElements || []);
          } catch (error) {
            console.error("AI suggestion failed:", error);
            toast({ title: "AI Suggestion Error", description: "Could not fetch suggestions.", variant: "destructive" });
            setSuggestions([]);
          } finally {
            setIsLoading(false);
          }
        }, 1000);
    
        return () => clearTimeout(handler);
    }, [title, section, dispatch, toast]);

    const addSuggestedElement = (elementType: string) => {
        // A simple map to handle capitalization differences
        const typeMap: { [key: string]: any } = {
            'text': 'Input',
            'email': 'Input',
            'dropdown': 'Select',
            'checkbox': 'Checkbox',
            'date picker': 'DatePicker'
        };
        const mappedType = typeMap[elementType.toLowerCase()];
        if(mappedType) {
            dispatch({ type: "ADD_ELEMENT", payload: { sectionId: section.id, type: mappedType } });
        } else {
            toast({ title: "Unknown Element", description: `Element type "${elementType}" is not supported.`, variant: "destructive" });
        }
    }
    
    const handleConditionalLogicUpdate = (logic: ConditionalLogic) => {
        dispatch({ type: "UPDATE_SECTION", payload: { ...section, conditionalLogic: logic } });
    }

    const handleColumnChange = (value: string) => {
        const columns = parseInt(value, 10) as 1 | 2 | 3;
        dispatch({ type: "UPDATE_SECTION", payload: { ...section, columns } });
    }

    return (
        <div className="flex flex-col gap-4">
             <div className="flex justify-between items-center">
                <h3 className="font-medium">Section Properties</h3>
                <Button
                    variant="destructive"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => dispatch({ type: 'DELETE_SECTION', payload: { sectionId: section.id } })}
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
            <div className="flex flex-col gap-2">
                <Label htmlFor="section-title">Title</Label>
                <Input id="section-title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
             <div className="flex flex-col gap-2">
                <Label>Layout Columns</Label>
                <RadioGroup
                    value={String(section.columns)}
                    onValueChange={handleColumnChange}
                    className="flex gap-4"
                >
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="1" id="cols-1" />
                        <Label htmlFor="cols-1">1</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="2" id="cols-2" />
                        <Label htmlFor="cols-2">2</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="3" id="cols-3" />
                        <Label htmlFor="cols-3">3</Label>
                    </div>
                </RadioGroup>
            </div>
            <div className="flex flex-col gap-2">
                <Label>Configuration</Label>
                 <Select
                    value={section.config}
                    onValueChange={(value) =>
                        dispatch({ type: "UPDATE_SECTION", payload: { ...section, config: value as 'expanded' | 'normal' } })
                    }
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select section type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="expanded">Expanded</SelectItem>
                        <SelectItem value="normal">Collapsible</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <ConditionalLogicSettings element={section} onUpdate={handleConditionalLogicUpdate} />
            <Separator />
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <Label>AI Suggestions</Label>
                    {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                </div>
                {suggestions.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {suggestions.map((s, i) => (
                            <Button key={i} variant="outline" size="sm" onClick={() => addSuggestedElement(s)}>
                                Add {s}
                            </Button>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">
                        {isLoading ? 'Generating...' : 'Type a descriptive section title to get suggestions.'}
                    </p>
                )}
            </div>
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
            <Separator />
            <h4 className="font-medium">Info Popup</h4>
            <div className="flex items-center justify-between rounded-lg p-3 shadow-sm">
                <Label htmlFor="enable-popup">Enable</Label>
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

function ElementProperties({ element }: { element: FormElementInstance }) {
  const { dispatch, state } = useBuilder();
  const { selectedElement } = state;
  const [props, setProps] = useState(element);

  const dynamicSelects = useMemo(() =>
    state.sections.flatMap(s =>
        s.elements.filter(e => e.type === 'Select' && e.dataSource === 'dynamic' && e.id !== element.id)
    ), [state.sections, element.id]
  );

  useEffect(() => {
    setProps(element);
  }, [element]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (!selectedElement) return;
      const section = state.sections.find(
        (s) => s.id === selectedElement.sectionId
      );
      const elementExists = section?.elements.some(
        (e) => e.id === selectedElement.elementId
      );

      if (elementExists) {
        dispatch({
          type: "UPDATE_ELEMENT",
          payload: { sectionId: selectedElement.sectionId, element: props },
        });
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [props, dispatch, selectedElement, state.sections]);

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

  const commonFields = (
    <>
      <div className="flex flex-col gap-2">
        <Label htmlFor="label">Label</Label>
        <Input id="label" value={element.label} onChange={(e) => updateElement('label', e.target.value)} />
      </div>
      <div className="flex items-center justify-between rounded-lg p-3 shadow-sm">
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

  const helperTextField = (
    <div className="flex flex-col gap-2">
      <Label htmlFor="helperText">Helper Text</Label>
      <Textarea id="helperText" value={element.helperText || ''} onChange={(e) => updateElement('helperText', e.target.value)} />
    </div>
  );
  
  const optionsField = (
    <div className="flex flex-col gap-2">
        <Label>Options</Label>
        {element.options?.map((option, index) => (
            <div key={index} className="flex items-center gap-2">
                <Input 
                    value={option}
                    onChange={(e) => {
                        const newOptions = [...element.options!];
                        newOptions[index] = e.target.value;
                        updateElement('options', newOptions);
                    }}
                />
                <Button variant="ghost" size="icon" onClick={() => {
                    const newOptions = element.options!.filter((_, i) => i !== index);
                    updateElement('options', newOptions);
                }}>
                    <X className="h-4 w-4" />
                </Button>
            </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => {
            const newOptions = [...(element.options || []), `Option ${ (element.options?.length || 0) + 1}`];
            updateElement('options', newOptions);
        }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Option
        </Button>
    </div>
  );

  const dynamicDataSourceFields = (
    <div className="flex flex-col gap-4">
        <Separator />
        <p className="font-medium">Dynamic Data Source</p>
        <div className="flex flex-col gap-2">
            <Label htmlFor="apiUrl">API URL</Label>
            <Input id="apiUrl" value={props.apiUrl || ''} onChange={(e) => updateProperty('apiUrl', e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
            <Label htmlFor="dataKey">Data Key</Label>
            <Input id="dataKey" value={props.dataKey || ''} onChange={(e) => updateProperty('dataKey', e.target.value)} placeholder="e.g., 'results' or 'data'"/>
        </div>
        <div className="flex flex-col gap-2">
            <Label htmlFor="valueKey">Option Value Key</Label>
            <Input id="valueKey" value={props.valueKey || ''} onChange={(e) => updateProperty('valueKey', e.target.value)} placeholder="e.g., 'id'"/>
        </div>
        <div className="flex flex-col gap-2">
            <Label htmlFor="labelKey">Option Label Key</Label>
            <Input id="labelKey" value={props.labelKey || ''} onChange={(e) => updateProperty('labelKey', e.target.value)} placeholder="e.g., 'name'"/>
        </div>
    </div>
  );

  const tableFields = (
    <>
        <div className="flex flex-col gap-2">
            <Label>Columns</Label>
            {element.columns?.map((col, index) => (
                <div key={col.id} className="flex items-center gap-2">
                    <Input
                        value={col.title}
                        onChange={(e) => {
                            const newCols = [...element.columns!];
                            newCols[index].title = e.target.value;
                            updateElement('columns', newCols);
                        }}
                    />
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
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => {
                const newCols = [...(element.columns || []), { id: crypto.randomUUID(), title: `Column ${ (element.columns?.length || 0) + 1}`, visible: true }];
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
        <div className="flex items-center justify-between rounded-lg p-3 shadow-sm">
            <Label htmlFor="allowAdd">Allow Add</Label>
            <Switch id="allowAdd" checked={element.allowAdd} onCheckedChange={(checked) => updateElement('allowAdd', checked)} />
        </div>
        <div className="flex items-center justify-between rounded-lg p-3 shadow-sm">
            <Label htmlFor="allowEdit">Allow Edit</Label>
            <Switch id="allowEdit" checked={element.allowEdit} onCheckedChange={(checked) => updateElement('allowEdit', checked)} />
        </div>
        <div className="flex items-center justify-between rounded-lg p-3 shadow-sm">
            <Label htmlFor="allowDelete">Allow Delete</Label>
            <Switch id="allowDelete" checked={element.allowDelete} onCheckedChange={(checked) => updateElement('allowDelete', checked)} />
        </div>
    </>
  );
  
  const content = () => {
      let fields;
      switch(element.type) {
        case "Title":
            fields = (
                <div className="flex flex-col gap-2">
                    <Label htmlFor="label">Title</Label>
                    <Input id="label" value={element.label} onChange={(e) => updateElement('label', e.target.value)} />
                </div>
            );
            break;
        case "Separator":
            fields = <p className="text-sm text-muted-foreground">No properties for this element.</p>;
            break;
        case "Display":
            const config = element.dataSourceConfig || { sourceElementId: "", displayKey: "" };
            fields = (
                <>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="label">Label</Label>
                        <Input id="label" value={element.label} onChange={(e) => updateElement('label', e.target.value)} />
                    </div>
                    {placeholderField}
                    <Separator />
                    <h4 className="font-medium">Data Source</h4>
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
                            placeholder="e.g., 'email' or 'phone'"
                        />
                    </div>
                </>
            );
            break;
        case "Input":
        case "Textarea":
            fields = <>{commonFields}{placeholderField}{helperTextField}</>;
            break;
        case "RichText":
            fields = <>{commonFields}{helperTextField}</>;
            break;
        case "Select":
            fields = (
                <>
                    {commonFields}
                    {placeholderField}
                    {helperTextField}
                    <Separator />
                     <div className="flex flex-col gap-2">
                        <Label>Data Source</Label>
                        <RadioGroup
                            defaultValue={element.dataSource || 'static'}
                            onValueChange={(val) => updateElement('dataSource', val)}
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="static" id="source-static" />
                                <Label htmlFor="source-static">Static Options</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="dynamic" id="source-dynamic" />
                                <Label htmlFor="source-dynamic">Dynamic (API)</Label>
                            </div>
                        </RadioGroup>
                    </div>
                    {element.dataSource === 'dynamic' ? dynamicDataSourceFields : optionsField}
                </>
            );
            break;
        case "RadioGroup":
             fields = <>
                {commonFields}
                {placeholderField}
                {helperTextField}
                {optionsField}
                <PopupSettings element={element} onUpdate={handlePopupUpdate} />
             </>;
             break;
        case "Checkbox":
            fields = <>
                {commonFields}
                {helperTextField}
                <PopupSettings element={element} onUpdate={handlePopupUpdate} />
            </>;
            break;
        case "DatePicker":
            fields = <>{commonFields}{helperTextField}</>;
            break;
        case "Table":
            fields = <>{commonFields}{tableFields}{helperTextField}</>
            break;
        default:
            return null;
      }

      // Don't show conditional logic for Title, Separator, RadioGroup, Checkbox, or Select itself
      const showConditionalLogic = !['Title', 'Separator', 'RadioGroup', 'Checkbox', 'Select'].includes(element.type);

      return <>
        {fields}
        {showConditionalLogic && <ConditionalLogicSettings element={element} onUpdate={handleConditionalLogicUpdate} />}
      </>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">{element.type} Properties</h3>
        <Button
            variant="destructive"
            size="icon"
            className="h-7 w-7"
            onClick={() => {
                if (!selectedElement) return;
                dispatch({ type: 'DELETE_ELEMENT', payload: { sectionId: selectedElement.sectionId, elementId: element.id } })
            }}
        >
            <X className="h-4 w-4" />
        </Button>
      </div>
      {content()}
    </div>
  );
}

    
