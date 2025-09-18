"use client";

import { useBuilder } from "@/hooks/use-builder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { X, Plus, Loader2 } from "lucide-react";
import { FormElementInstance, Section } from "@/lib/types";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useEffect, useState } from "react";
import { suggestElementsAction } from "@/actions/suggest-elements";
import { createNewElement } from "@/lib/form-elements";
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
    <aside className="w-80 p-4 border-l bg-card overflow-y-auto">
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
      {!selected && <FormProperties />}
      {selected && 'elements' in selected && <SectionProperties section={selected} />}
      {selected && 'type' in selected && <ElementProperties element={selected} />}
    </aside>
  );
}

function FormProperties() {
    const { state, dispatch } = useBuilder();
    return (
        <div className="flex flex-col gap-4">
            <h3 className="font-medium">Form Properties</h3>
            <div className="flex flex-col gap-2">
                <Label>Layout Columns</Label>
                <RadioGroup
                    defaultValue={String(state.columns)}
                    onValueChange={(val) => dispatch({ type: "SET_COLUMNS", payload: val === '2' ? 2 : 3 })}
                >
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="2" id="cols-2" />
                        <Label htmlFor="cols-2">2 Columns</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="3" id="cols-3" />
                        <Label htmlFor="cols-3">3 Columns</Label>
                    </div>
                </RadioGroup>
            </div>
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


function ElementProperties({ element }: { element: FormElementInstance }) {
  const { dispatch, state } = useBuilder();
  const { selectedElement } = state;
  const [props, setProps] = useState(element);

  useEffect(() => {
    setProps(element);
  }, [element]);

  useEffect(() => {
    const handler = setTimeout(() => {
        if (!selectedElement) return;
        dispatch({ type: "UPDATE_ELEMENT", payload: { sectionId: selectedElement.sectionId, element: props } });
    }, 500);
    return () => clearTimeout(handler);
  }, [props, dispatch, selectedElement]);

  const updateProperty = (key: keyof FormElementInstance, value: any) => {
    setProps(prev => ({...prev, [key]: value}));
  };

  const updateElement = (key: keyof FormElementInstance, value: any) => {
    if (!selectedElement) return;
    dispatch({ type: "UPDATE_ELEMENT", payload: { sectionId: selectedElement.sectionId, element: { ...element, [key]: value } } });
  };
  
  if (!element) return null;

  const commonFields = (
    <>
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
  
  const content = () => {
      switch(element.type) {
        case "Title":
            return (
                <div className="flex flex-col gap-2">
                    <Label htmlFor="label">Title</Label>
                    <Input id="label" value={element.label} onChange={(e) => updateElement('label', e.target.value)} />
                </div>
            )
        case "Separator":
            return <p className="text-sm text-muted-foreground">No properties for this element.</p>;
        case "Input":
        case "Textarea":
            return <>{commonFields}{placeholderField}{helperTextField}</>
        case "Select":
            return (
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
                                <Label htmlFor="source-static">Static</Label>
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
        case "RadioGroup":
            return <>{commonFields}{placeholderField}{helperTextField}{optionsField}</>
        case "Checkbox":
            return <>{commonFields}{helperTextField}</>
        case "DatePicker":
            return <>{commonFields}{helperTextField}</>
        default:
            return null;
      }
  }

  return (
    <div className="flex flex-col gap-4">
      <h3 className="font-medium">{element.type} Properties</h3>
      {content()}
    </div>
  );
}
