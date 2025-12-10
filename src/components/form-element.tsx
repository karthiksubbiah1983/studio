

"use client";

import { FormElementInstance, Rule, Condition, Section, TableColumn, DataGridColumn, ListItemElement } from "@/lib/types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { fetchFromApi } from "@/services/api";
import { Popup } from "@/components/ui/popup";
import { Button } from "@/components/ui/button";
import { icons, Info, Plus, Trash, ChevronDown, AlertCircle, Loader2, Link, Eye, Upload, X, File as FileIcon, Search, ChevronLeft, ChevronRight, CalendarDays, Edit } from "lucide-react";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LexicalEditor } from "@/components/lexical/lexical-editor";
import { evaluate } from "@/lib/formula-parser";
import { cn, findFirstArray, getAllElements, getNestedValue } from "@/lib/utils";
import { useBuilder } from "@/hooks/use-builder";
import { evaluateRule } from "@/components/form-preview-helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FormPreviewPopup } from "./form-preview-popup";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { useAuth } from "@/hooks/use-auth";


type Props = {
  element: FormElementInstance;
  value: any;
  onValueChange: (id: string, value: any, fullObject?: any) => void;
  formState?: { [key: string]: any };
  isParentHorizontal?: boolean;
  isTableCell?: boolean;
  rowContext?: any;
};

const interpolateString = (template: string, data: { sections: Section[], formState: { [key: string]: any } }): string => {
    return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, key) => {
        // Find the element with this key
        const allElements = getAllElements(data.sections || []);
        const element = allElements.find(el => 'key' in el && el.key === key);
        if (element && 'id' in element && data.formState && data.formState[element.id]) {
             return data.formState[element.id].value || match;
        }
        return match;
    });
}


export function FormElementRenderer({ element, value: initialValue, onValueChange, formState, isParentHorizontal, isTableCell, rowContext }: Props) {
  const { rules, sections } = useBuilder();
  const { user } = useAuth();
  const [dynamicOptions, setDynamicOptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isPreviewPopupOpen, setIsPreviewPopupOpen] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  const context = useMemo(() => {
    if (rowContext) {
        // If we have row context, enrich it with the main form state for broader rule evaluation
        const fullContext = { ...formState, ...rowContext };
        return fullContext;
    }
    return formState;
  }, [rowContext, formState]);


   const isVisible = useMemo(() => {
    if (!context) return true;

    const showRules = rules.filter(rule => rule && rule.behaviors && rule.behaviors.some(b => b.type === 'show' && b.targetElementId === element.id));
    const hideRules = rules.filter(rule => rule && rule.behaviors && rule.behaviors.some(b => b.type === 'hide' && b.targetElementId === element.id));
    
    let visible = true; 

    if (showRules.length > 0) {
      visible = showRules.some(r => evaluateRule(r, context));
    }

    if (visible && hideRules.length > 0) {
      if (hideRules.some(r => evaluateRule(r, context))) {
        visible = false;
      }
    }
    
    return visible;
  }, [element.id, context, rules]);

  const { value, isReadOnly, calculatedValue } = useMemo(() => {
    let readOnly = false;
    let newCalculatedValue: any = undefined;
    
    const contextForEval = rowContext || formState;

    if (element.type === 'Input' && element.formula && contextForEval) {
        const formulaContext = Object.keys(contextForEval).reduce((acc, key) => {
            const elKey = getAllElements(sections).find(e => e.id === key)?.key;
            if (elKey) {
                 acc[elKey] = contextForEval[key]?.value;
            } else {
                 acc[key] = contextForEval[key]; // For rowContext which has direct keys
            }
            return acc;
        }, {} as Record<string, any>);

        newCalculatedValue = String(evaluate(element.formula, formulaContext));
        readOnly = true;
    }
    else if (!contextForEval || !rules) return { value: initialValue, isReadOnly: readOnly, calculatedValue: newCalculatedValue };
    
    for (const rule of rules) {
        const isRuleMet = evaluateRule(rule, contextForEval);
        if (isRuleMet) {
            for (const behavior of rule.behaviors) {
                if (behavior.type === 'set_value' && behavior.targetElementId === element.id) {
                    newCalculatedValue = behavior.value;
                    readOnly = true; 
                }
            }
        }
    }
    
    let finalValue = newCalculatedValue !== undefined ? newCalculatedValue : (initialValue ?? ('defaultValue' in element ? element.defaultValue : undefined));

    return { value: finalValue, isReadOnly: readOnly, calculatedValue: newCalculatedValue };
  }, [element, initialValue, rules, context, formState, sections, rowContext]);


  useEffect(() => {
    if (calculatedValue !== undefined && calculatedValue !== initialValue) {
        onValueChange(element.id, calculatedValue);
    }
  }, [calculatedValue, initialValue, onValueChange, element.id]);
  
 const isDisabled = useMemo(() => {
    if (!context) return false;

    const disableRules = rules.filter(rule => rule && rule.behaviors && rule.behaviors.some(b => b.type === 'disable' && b.targetElementId === element.id));
    if (disableRules.some(r => evaluateRule(r, context))) {
      return true;
    }

    const enableRules = rules.filter(rule => rule && rule.behaviors && rule.behaviors.some(b => b.type === 'enable' && b.targetElementId === element.id));
    if (enableRules.length > 0) {
      return !enableRules.some(r => evaluateRule(r, context));
    }

    return false;
  }, [element.id, context, rules]);

  const appliedStyles = useMemo(() => {
    const style: React.CSSProperties = {};
    let error: string | null = null;
    if (!context || !rules) return { style, error };
    
    for (const rule of rules) {
        const isRuleMet = evaluateRule(rule, context);

        if (isRuleMet) {
            for (const behavior of rule.behaviors) {
                if (behavior.targetElementId === element.id) {
                    if (behavior.type === 'change_color' && behavior.targetProperty && behavior.color) {
                        style[behavior.targetProperty as any] = behavior.color;
                    }
                    if (behavior.type === 'set_error') {
                        error = behavior.message || "Invalid input.";
                    }
                }
            }
        }
    }
    return { style, error };
  }, [element.id, context, rules]);
  
  const allElements = useMemo(() => getAllElements(sections), [sections]);

  useEffect(() => {
    if ((element.type === 'Select' || element.type === 'List') && element.dataSource === 'dynamic') {
      
      if (element.apiUrl) {
        let finalApiUrl = element.apiUrl;

        setIsLoading(true);
        fetchFromApi(finalApiUrl)
          .then(data => setDynamicOptions(data || []))
          .finally(() => setIsLoading(false));
      }
    }
  }, [element.apiUrl, element.type, element.dataSource]);


  const { type, label, required, placeholder, helperText, options, dataSourceConfig, popup, inputFormat, isLink, linkUrl, textStyle, color, content: richTextContent, key } = element;

  const PopupIcon = popup?.icon ? (icons as any)[popup.icon] : null;
  
  if (!isVisible) return null;

  const renderLabelWithPopup = () => (
    <div className="flex items-center gap-2">
       <Label className="text-[0.9rem]" style={appliedStyles.style}>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {popup?.enabled && (
        <>
            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setIsPopupOpen(true)}>
                <Info className="h-4 w-4 text-muted-foreground" />
            </Button>
            <Popup
                isOpen={isPopupOpen}
                onOpenChange={setIsPopupOpen}
                title={popup.title}
                description={popup.description}
                icon={PopupIcon}
                iconColor={popup.iconColor}
            />
        </>
      )}
    </div>
  )

  const renderLabel = () => {
    if (!label) return null;
    return (
        <div className="flex justify-between items-center mb-2">
        <Label className="text-[0.9rem]" style={appliedStyles.style}>
            {label}
            {required && <span className="text-destructive"> *</span>}
        </Label>
        </div>
    );
  }

  const renderError = () => {
    if (!appliedStyles.error) return null;
    return (
        <p className="text-sm text-destructive mt-1 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {appliedStyles.error}
        </p>
    )
  }
  
  let content = null;

  switch (type) {
    case "Separator":
      content = <Separator />;
      break;
    case "Display": {
        let finalDisplayValue;

        if (isTableCell && rowContext) {
            // For a List, rowContext can be a string (static) or an object (dynamic)
            if (typeof rowContext === 'string') {
                finalDisplayValue = rowContext;
            } else if (typeof rowContext === 'object' && element.key) {
                finalDisplayValue = getNestedValue(rowContext, element.key);
            }
        } else if (dataSourceConfig?.sourceType === 'currentUser') {
            finalDisplayValue = user?.username || 'Guest';
        } else if (dataSourceConfig?.sourceType === 'currentDateTime') {
            finalDisplayValue = format(currentDateTime, 'PPP p');
        } else if (isReadOnly) {
            finalDisplayValue = value;
        } else if (dataSourceConfig?.sourceElementId && formState) {
            const sourceElement = allElements.find(el => el.id === dataSourceConfig.sourceElementId);
            const sourceValue = formState[dataSourceConfig.sourceElementId];
            if (sourceElement && sourceValue) {
                if (sourceElement.type === 'Select' && sourceValue.fullObject && dataSourceConfig.displayKey) {
                    finalDisplayValue = getNestedValue(sourceValue.fullObject, dataSourceConfig.displayKey);
                } else {
                    finalDisplayValue = sourceValue.value;
                }
            }
        }
        
        if (finalDisplayValue === undefined || finalDisplayValue === null) {
            finalDisplayValue = label;
        }
        
        if (isLink && linkUrl) {
            const finalUrl = interpolateString(linkUrl, { formState: formState || {}, sections });
            return (
                    <a href={finalUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 mt-1 text-primary cursor-pointer hover:underline">
                    <Link className="h-4 w-4" />
                    <span className="text-sm">{String(finalDisplayValue)}</span>
                </a>
            )
        }

        const style = textStyle || 'p';
        const classes = {
            p: 'text-muted-foreground text-sm',
            h1: 'text-4xl font-bold',
            h2: 'text-3xl font-bold',
            h3: 'text-2xl font-bold',
            h4: 'text-xl font-bold',
            h5: 'text-lg font-bold',
            h6: 'text-base font-bold',
        };
        const Tag = style === 'p' ? 'p' : style;
        const finalStyle = { ...appliedStyles.style };
        if (!finalStyle.color && color) { 
            finalStyle.color = color;
        }
        content = <Tag className={cn(classes[style], 'mt-1', isTableCell && 'p-2 text-sm')} style={finalStyle}>{String(finalDisplayValue)}</Tag>;
        break;
    }
    case "Container": {
        const { elements, direction, justify, align } = element;
        const alignmentClasses = {
            justify: {
                start: 'justify-start',
                center: 'justify-center',
                end: 'justify-end',
                between: 'justify-between',
                around: 'justify-around',
                evenly: 'justify-evenly',
            },
            align: {
                start: 'items-start',
                center: 'items-center',
                end: 'items-end',
                stretch: 'items-stretch',
                baseline: 'items-baseline',
            }
        }
        content = (
            <div style={appliedStyles.style} className={cn("flex gap-4",
                direction === 'horizontal' ? 'flex-row' : 'flex-col',
                justify && alignmentClasses.justify[justify],
                align && alignmentClasses.align[align],
            )}>
                {elements?.map(el => (
                    <FormElementRenderer 
                        key={el.id} 
                        element={el} 
                        value={formState?.[el.id]?.value} 
                        onValueChange={onValueChange} 
                        formState={formState}
                        isParentHorizontal={direction === 'horizontal'}
                    />
                ))}
            </div>
        )
        break;
    }
    case "Input":
      const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value;
        if (inputFormat === 'number') {
            val = val.replace(/[^0-9.]/g, '');
        } else if (inputFormat === 'alphanumeric') {
            val = val.replace(/[^a-zA-Z0-9]/g, '');
        }
        onValueChange(element.id, val);
      };
      content = (
        <div>
          {renderLabel()}
          <Input 
            placeholder={placeholder}
            value={value || ""}
            onChange={handleInputChange}
            style={appliedStyles.style}
            className={cn(appliedStyles.error && "border-destructive")}
            disabled={isDisabled || isReadOnly}
            readOnly={isReadOnly}
          />
          {helperText && (
            <p className="text-sm text-muted-foreground mt-1">{helperText}</p>
          )}
          {renderError()}
        </div>
      );
      break;
    case "Textarea":
      content = (
        <div>
          {renderLabel()}
          <Textarea 
            placeholder={placeholder}
            value={value || ""}
            onChange={(e) => onValueChange(element.id, e.target.value)}
            style={appliedStyles.style}
            className={cn(appliedStyles.error && "border-destructive")}
            disabled={isDisabled}
          />
          {helperText && (
            <p className="text-sm text-muted-foreground mt-1">{helperText}</p>
          )}
          {renderError()}
        </div>
      );
      break;
    case "RichText":
      content = (
        <div>
            {renderLabel()}
            <div 
                className="prose dark:prose-invert text-sm w-full"
                dangerouslySetInnerHTML={{ __html: richTextContent || "" }}
            />
        </div>
      );
      break;
    case "Select":
        const handleSelectChange = (val: string) => {
            if (element.dataSource === 'dynamic') {
                const fullObject = dynamicOptions.find(opt => String(getNestedValue(opt, element.valueKey!)) === val);
                onValueChange(element.id, val, fullObject);
            } else {
                 onValueChange(element.id, val);
            }
        }
      content = (
        <div>
          {renderLabel()}
          <Select value={value} onValueChange={handleSelectChange} disabled={isDisabled}>
            <SelectTrigger style={appliedStyles.style} className={cn(appliedStyles.error && "border-destructive")}>
              <SelectValue placeholder={isLoading ? "Loading..." : placeholder} />
            </SelectTrigger>
            <SelectContent>
              {element.dataSource === 'dynamic' ? (
                dynamicOptions.map((option, index) => (
                  <SelectItem key={index} value={String(getNestedValue(option, element.valueKey!))}>
                    {getNestedValue(option, element.labelKey!)}
                  </SelectItem>
                ))
              ) : (
                options?.map((option, index) => (
                  <SelectItem key={index} value={option}>
                    {option}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {helperText && (
            <p className="text-sm text-muted-foreground mt-1">{helperText}</p>
          )}
          {renderError()}
        </div>
      );
      break;
    case "List": {
        const isCheckbox = element.listType === 'checkbox';
        const isDisplayOnly = element.listType === 'display';
        const currentSelection = isCheckbox ? (Array.isArray(value) ? value : []) : (value || '');

        const handleListChange = (itemValue: string) => {
            if (isDisplayOnly) return;
            if (isCheckbox) {
                const newSelection = currentSelection.includes(itemValue)
                    ? currentSelection.filter((v: string) => v !== itemValue)
                    : [...currentSelection, itemValue];
                onValueChange(element.id, newSelection);
            } else {
                onValueChange(element.id, itemValue);
            }
        };

        const listOptions = element.dataSource === 'dynamic' ? dynamicOptions : (options || []);

        const getDisplaySelection = () => {
            if (element.displaySelection === 'none' || !currentSelection || isDisplayOnly) {
                return [];
            }
            if (element.displaySelection === 'selected') {
                return listOptions.filter(opt => {
                    const optValue = typeof opt === 'object' ? getNestedValue(opt, element.valueKey!) : opt;
                    return isCheckbox ? currentSelection.includes(optValue) : currentSelection === optValue;
                });
            } else { // unselected
                 return listOptions.filter(opt => {
                    const optValue = typeof opt === 'object' ? getNestedValue(opt, element.valueKey!) : opt;
                    return isCheckbox ? !currentSelection.includes(optValue) : currentSelection !== optValue;
                });
            }
        }

        const score = useMemo(() => {
            if (!element.enableScoring || isDisplayOnly) return null;
            const scorePerItem = element.scorePerItem || 0;
            const selectedCount = isCheckbox ? currentSelection.length : (currentSelection ? 1 : 0);
            return selectedCount * scorePerItem;
        }, [currentSelection, element.enableScoring, element.scorePerItem, isCheckbox, isDisplayOnly]);

        const passed = score !== null && element.passingScore !== undefined ? score >= element.passingScore : null;
        
        const displayedSelection = getDisplaySelection();
        
        content = (
            <div>
                {renderLabel()}
                <div className="rounded-md border p-2 space-y-2">
                    {isLoading ? <Loader2 className="animate-spin" /> : listOptions.map((option, index) => {
                        const itemValue = typeof option === 'object' ? getNestedValue(option, element.valueKey!) : option;
                        const isSelected = isCheckbox ? currentSelection.includes(itemValue) : currentSelection === itemValue;
                        
                        return (
                            <div
                                key={index}
                                onClick={() => handleListChange(itemValue)}
                                className={cn(
                                    "flex items-center gap-4 p-3 rounded-md transition-colors",
                                    !isDisplayOnly && "cursor-pointer",
                                    isSelected ? "bg-primary/10 border-primary/30" : "hover:bg-accent"
                                )}
                            >
                                {!isDisplayOnly && (
                                    <div className="flex-shrink-0">
                                        {isCheckbox ? <Checkbox checked={isSelected} readOnly /> : <RadioGroupItem value={itemValue} checked={isSelected} />}
                                    </div>
                                )}
                                <div className="flex-1 space-y-2">
                                     {(element.listItemElements || []).map(itemEl => (
                                        <FormElementRenderer 
                                            key={itemEl.id}
                                            element={{...itemEl.element, id: `${element.id}::${itemEl.element.key}`}}
                                            value={null} // Value is handled by rowContext
                                            onValueChange={() => {}} // Display only
                                            rowContext={option}
                                            isTableCell={true}
                                        />
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
                 {element.displaySelection !== 'none' && displayedSelection.length > 0 && !isDisplayOnly && (
                    <div className="mt-4">
                        <p className="text-sm font-medium mb-2">{element.displaySelection === 'selected' ? 'Selected' : 'Unselected'} Items:</p>
                        <div className="rounded-md border p-2 space-y-1">
                            {displayedSelection.map((opt, index) => {
                                 const itemLabel = typeof opt === 'object' ? getNestedValue(opt, element.labelKey!) : opt;
                                 return <div key={index} className="p-2 bg-muted/50 rounded-md text-sm">{itemLabel}</div>
                            })}
                        </div>
                    </div>
                 )}
                 {element.enableScoring && score !== null && (
                    <div className="mt-4 flex justify-between items-center rounded-md border p-3 bg-muted/50">
                        <p className="font-medium">Total Score: {score}</p>
                        {passed !== null && (
                            <div className={cn("font-bold px-3 py-1 rounded-full text-sm", passed ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800")}>
                                {passed ? "Pass" : "Fail"}
                            </div>
                        )}
                    </div>
                 )}
            </div>
        );
        break;
    }
    case "Checkbox":
        content = (
            <div className="flex items-start space-x-2">
                <Checkbox 
                    id={element.id}
                    checked={value}
                    onCheckedChange={(checked) => onValueChange(element.id, checked)}
                    disabled={isDisabled}
                />
                <div className="grid gap-1.5 leading-none">
                    {renderLabelWithPopup()}
                    {helperText && (
                        <p className="text-sm text-muted-foreground mt-1">{helperText}</p>
                    )}
                    {renderError()}
                </div>
            </div>
        );
        break;
    case "RadioGroup":
      content = (
        <div>
          {renderLabelWithPopup()}
          <RadioGroup value={value} onValueChange={(val) => onValueChange(element.id, val)} className="mt-3" disabled={isDisabled}>
            {options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem
                  value={option}
                  id={`${element.id}-${index}`}
                />
                <Label htmlFor={`${element.id}-${index}`} style={appliedStyles.style}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
          {helperText && (
            <p className="text-sm text-muted-foreground mt-1">{helperText}</p>
          )}
          {renderError()}
        </div>
      );
      break;
    case "DatePicker":
      const dateValue = value ? new Date(value) : undefined;
      const handleDateChange = (date: Date | undefined) => {
        const newDate = dateValue || new Date();
        if(date) {
            newDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
            onValueChange(element.id, newDate.toISOString());
        }
      }
      const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = e.target.value;
        const [hours, minutes] = time.split(':').map(Number);
        const newDate = dateValue || new Date();
        newDate.setHours(hours, minutes);
        onValueChange(element.id, newDate.toISOString());
      }
      const timeValue = dateValue ? `${String(dateValue.getHours()).padStart(2,'0')}:${String(dateValue.getMinutes()).padStart(2, '0')}` : "";

      content = (
        <div className={cn(isDisabled && 'pointer-events-none opacity-50')}>
          {renderLabel()}
          <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        !value && "text-muted-foreground",
                        appliedStyles.error && "border-destructive"
                    )}
                    style={appliedStyles.style}
                >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {value ? format(new Date(value), "PPP p") : (<span>{placeholder || "Pick a date"}</span>)}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
                 <Calendar 
                    mode="single"
                    selected={dateValue}
                    onSelect={handleDateChange}
                    initialFocus
                    className={cn("p-0 border-b rounded-md")}
                 />
                 <div className="p-2 border-t">
                    <Input 
                        type="time"
                        value={timeValue}
                        onChange={handleTimeChange}
                    />
                 </div>
            </PopoverContent>
          </Popover>
          {helperText && (
            <p className="text-sm text-muted-foreground mt-1">{helperText}</p>
          )}
          {renderError()}
        </div>
      );
      break;
    case "DataGrid":
        const [gridData, setGridData] = useState<any[]>(initialValue || []);
        const [isFormOpen, setIsFormOpen] = useState(false);
        const [editingIndex, setEditingIndex] = useState<number | null>(null);
        const [currentFormData, setCurrentFormData] = useState<Record<string, any>>({});

        useEffect(() => {
            if(initialValue) {
                setGridData(initialValue);
            }
        }, [initialValue]);

        const openForm = (index: number | null = null) => {
            if (index !== null) {
                setEditingIndex(index);
                const rowData = gridData[index];
                const formDataForEditing: Record<string, any> = {};
                 element.dataGridColumns?.forEach(col => {
                    const elId = `${element.id}::${col.key}`;
                    formDataForEditing[elId] = { value: getNestedValue(rowData, col.key) };
                })
                setCurrentFormData(formDataForEditing);
            } else {
                setEditingIndex(null);
                const initialFormData: Record<string, any> = {};
                element.dataGridColumns?.forEach(col => {
                    initialFormData[`${element.id}::${col.key}`] = { value: undefined };
                });
                setCurrentFormData(initialFormData);
            }
            setIsFormOpen(true);
        };
        
        const handleFormValueChange = (id: string, val: any, fullObject?: any) => {
            setCurrentFormData(prev => ({...prev, [id]: { value: val, fullObject }}));
        }

        const handleSave = () => {
            let newData = [...gridData];
            const finalDataToSave = (element.dataGridColumns || []).reduce((acc, col) => {
                const proxyId = `${element.id}::${col.key}`;
                if(currentFormData[proxyId] && currentFormData[proxyId].value !== undefined) {
                    acc[col.key] = currentFormData[proxyId].value;
                } else if (col.element.type === 'Display') {
                    if (col.element.dataSourceConfig?.sourceType === 'currentUser') {
                         acc[col.key] = user?.username || 'Guest';
                    } else if (col.element.dataSourceConfig?.sourceType === 'currentDateTime') {
                         acc[col.key] = new Date().toISOString();
                    }
                }
                return acc;
            }, {} as Record<string, any>);

            if (editingIndex !== null) {
                newData[editingIndex] = finalDataToSave;
            } else {
                newData.push(finalDataToSave);
            }
            setGridData(newData);
            onValueChange(element.id, newData);
            setIsFormOpen(false);
        }
        
        const handleDelete = (index: number) => {
            const newData = gridData.filter((_, i) => i !== index);
            setGridData(newData);
            onValueChange(element.id, newData);
        }
        
        const getColumnStyle = (col: DataGridColumn, row: any) => {
            const proxyId = `${element.id}::${col.key}`;
            const styles: React.CSSProperties = {};
             for (const rule of rules) {
                const isRuleMet = evaluateRule(rule, row);
                if (isRuleMet) {
                    for (const behavior of rule.behaviors) {
                        if (behavior.targetElementId === proxyId && behavior.type === 'change_color' && behavior.targetProperty && behavior.color) {
                            styles[behavior.targetProperty as any] = behavior.color;
                        }
                    }
                }
            }
            return styles;
        }

        content = (
            <div>
                {renderLabel()}
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {element.dataGridColumns?.map(col => <TableHead key={col.id}>{col.label}</TableHead>)}
                                <TableHead className="w-[100px] text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {gridData.map((row, rowIndex) => (
                                <TableRow key={rowIndex}>
                                    {element.dataGridColumns?.map(col => (
                                        <TableCell key={col.id} style={getColumnStyle(col, row)}>
                                            {String(getNestedValue(row, col.key) ?? '')}
                                        </TableCell>
                                    ))}
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => openForm(rowIndex)}>
                                            <Edit className="h-4 w-4"/>
                                        </Button>
                                         <Button variant="ghost" size="icon" onClick={() => handleDelete(rowIndex)}>
                                            <Trash className="h-4 w-4 text-destructive"/>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {gridData.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={(element.dataGridColumns?.length || 0) + 1} className="text-center text-muted-foreground">
                                        No entries yet.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                <Button variant="outline" className="mt-4" onClick={() => openForm()}>
                    <Plus className="mr-2 h-4 w-4"/> Add Entry
                </Button>
                <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingIndex !== null ? 'Edit Entry' : 'Add New Entry'}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            {element.dataGridColumns?.map(col => {
                                const proxyId = `${element.id}::${col.key}`;
                                const rowContextForPopup = (element.dataGridColumns || []).reduce((acc, c) => {
                                        const currentId = `${element.id}::${c.key}`;
                                        acc[c.key] = currentFormData[currentId]?.value;
                                        return acc;
                                    }, {} as Record<string, any>);
                                return (
                                <FormElementRenderer 
                                    key={col.id}
                                    element={{ ...col.element, id: proxyId, label: col.label }}
                                    value={currentFormData[proxyId]?.value}
                                    onValueChange={handleFormValueChange}
                                    rowContext={rowContextForPopup}
                                />
                            )})}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
                            <Button onClick={handleSave}>Save</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        );
        break;
    case "Table":
        const [tableData, setTableData] = useState<any[]>([]);
        const [isTableLoading, setIsTableLoading] = useState(false);
        const [searchTerm, setSearchTerm] = useState("");
        const [currentPage, setCurrentPage] = useState(1);
        const pageSize = element.pageSize || 5;

        useEffect(() => {
            if (element.dataSource === 'dynamic' && element.apiUrl) {
                setIsTableLoading(true);
                fetchFromApi(element.apiUrl)
                    .then(data => {
                        const arrayData = findFirstArray(data);
                        if (arrayData) {
                            onValueChange(element.id, arrayData);
                            setTableData(arrayData);
                        }
                    })
                    .finally(() => setIsTableLoading(false));
            } else {
                 const staticRows = (initialValue || []) as any[];
                const numDefaultRows = element.defaultRows || 0;
                if (staticRows.length < numDefaultRows) {
                    const newRows = Array(numDefaultRows - staticRows.length).fill({}).map(() => ({}));
                    const initialData = [...staticRows, ...newRows];
                    onValueChange(element.id, initialData);
                    setTableData(initialData);
                } else if (staticRows.length > 0) {
                     setTableData(staticRows);
                } else {
                    setTableData([]);
                }
            }
        }, [element.dataSource, element.apiUrl, element.defaultRows]);
        
        useEffect(() => {
            if (initialValue) {
                setTableData(initialValue);
            }
        }, [initialValue]);
        
        const filteredTableData = useMemo(() => {
            if (!searchTerm) return tableData;
            return tableData.filter(row => 
                Object.values(row).some(cellValue => 
                    String(cellValue).toLowerCase().includes(searchTerm.toLowerCase())
                )
            );
        }, [tableData, searchTerm]);

        const totalPages = element.paginationEnabled ? Math.ceil(filteredTableData.length / pageSize) : 1;
        const paginatedData = element.paginationEnabled ? filteredTableData.slice((currentPage - 1) * pageSize, currentPage * pageSize) : filteredTableData;

        const handlePrevPage = () => setCurrentPage(p => Math.max(1, p - 1));
        const handleNextPage = () => setCurrentPage(p => Math.min(totalPages, p + 1));

        useEffect(() => {
            setCurrentPage(1);
        }, [searchTerm]);

        const handleRowValueChange = (rowIndex: number, columnKey: string, cellValue: any) => {
            let newRows = [...tableData];
            if (!newRows[rowIndex]) {
                newRows[rowIndex] = {};
            }
            newRows[rowIndex][columnKey] = cellValue;

            element.tableColumns?.forEach(col => {
                if (col.formula) {
                    const formulaResult = evaluate(col.formula, newRows[rowIndex]);
                    newRows[rowIndex][col.key] = formulaResult;
                }
            })

            onValueChange(element.id, newRows);
            setTableData(newRows);
        }

        const handleAddRow = () => {
            const newRow = {};
            const newRows = [...tableData, newRow];
            onValueChange(element.id, newRows);
            setTableData(newRows);
        }

        const handleDeleteRow = (rowIndex: number) => {
            const newRows = tableData.filter((_, i) => i !== rowIndex);
            onValueChange(element.id, newRows);
            setTableData(newRows);
        }

        if (isTableLoading) {
            return <div><Loader2 className="animate-spin" /> Loading table data...</div>
        }

        content = (
            <div>
                {renderLabel()}
                {element.enableSearch && (
                    <div className="relative mb-4">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search table..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                )}
                {/* Desktop Table View */}
                 <div className="rounded-md border hidden md:block">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {element.tableColumns?.map(col => <TableHead key={col.id}>{col.label}</TableHead>)}
                                {element.canAddRows && element.dataSource !== 'dynamic' && <TableHead className="w-[50px]"></TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedData.map((row, paginatedIndex) => {
                                const originalIndex = ((currentPage - 1) * pageSize) + paginatedIndex;
                                return (
                                <TableRow key={originalIndex}>
                                    {element.tableColumns?.map(col => {
                                        const proxyId = `${element.id}::${col.key}`;
                                        let cellValue = getNestedValue(row, col.key);

                                        if (col.formula) {
                                          const calculatedValue = evaluate(col.formula, row);
                                          cellValue = calculatedValue;
                                        }

                                        if (col.formula) {
                                            return (
                                                <TableCell key={proxyId}>
                                                    <Input readOnly value={cellValue} className="border-none bg-transparent" />
                                                </TableCell>
                                            )
                                        }

                                        return (
                                        <TableCell key={proxyId}>
                                            <FormElementRenderer 
                                                element={{...col.element, id: proxyId, key: col.key}}
                                                value={cellValue}
                                                onValueChange={(_id, val) => handleRowValueChange(originalIndex, col.key, val)}
                                                formState={formState}
                                                rowContext={row}
                                                isTableCell={true}
                                            />
                                        </TableCell>
                                    )})}
                                     {element.canAddRows && element.dataSource !== 'dynamic' && (
                                        <TableCell>
                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteRow(originalIndex)}>
                                                <Trash className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </TableCell>
                                    )}
                                </TableRow>
                            )})}
                        </TableBody>
                    </Table>
                </div>
                 {/* Mobile Card View */}
                 <div className="grid grid-cols-1 gap-4 md:hidden">
                    {paginatedData.map((row, paginatedIndex) => {
                        const originalIndex = ((currentPage - 1) * pageSize) + paginatedIndex;
                        return (
                            <div key={originalIndex} className="border rounded-lg p-4 space-y-4">
                                {element.tableColumns?.map(col => {
                                    const proxyId = `${element.id}::${col.key}`;
                                    let cellValue = getNestedValue(row, col.key);

                                    if (col.formula) {
                                        const calculatedValue = evaluate(col.formula, row);
                                        cellValue = calculatedValue;
                                    }

                                    return (
                                        <div key={proxyId} className="space-y-1">
                                            <Label className="text-muted-foreground">{col.label}</Label>
                                            {col.formula ? (
                                                <Input readOnly value={cellValue} className="border-none bg-transparent p-0 h-auto" />
                                            ) : (
                                                <FormElementRenderer
                                                    element={{...col.element, id: proxyId, key: col.key }}
                                                    value={cellValue}
                                                    onValueChange={(_id, val) => handleRowValueChange(originalIndex, col.key, val)}
                                                    formState={formState}
                                                    rowContext={row}
                                                    isTableCell={true}
                                                />
                                            )}
                                        </div>
                                    )
                                })}
                                {element.canAddRows && element.dataSource !== 'dynamic' && (
                                    <div className="pt-2 border-t">
                                        <Button variant="ghost" size="sm" className="w-full justify-center text-destructive" onClick={() => handleDeleteRow(originalIndex)}>
                                            <Trash className="h-4 w-4 mr-2" />
                                            Delete Row
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                 </div>

                 {element.canAddRows && element.dataSource !== 'dynamic' && (
                    <Button variant="outline" size="sm" className="mt-4 w-full md:w-auto" onClick={handleAddRow}>
                        <Plus className="h-4 w-4 mr-2"/>
                        Add Row
                    </Button>
                )}
                {element.paginationEnabled && totalPages > 1 && (
                    <div className="flex items-center justify-end space-x-2 py-4">
                        <div className="text-sm text-muted-foreground">
                            Page {currentPage} of {totalPages}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePrevPage}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleNextPage}
                            disabled={currentPage === totalPages}
                        >
                            Next
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </div>
        );
        break;
    case "Preview":
        content = (
             <div>
                {renderLabel()}
                <Button variant="outline" className="w-full" onClick={() => setIsPreviewPopupOpen(true)}>
                    <Eye className="mr-2 h-4 w-4" />
                    {label}
                </Button>
                <FormPreviewPopup
                    isOpen={isPreviewPopupOpen}
                    onOpenChange={setIsPreviewPopupOpen}
                    sectionIds={element.previewSectionIds || []}
                    formState={formState || {}}
                />
            </div>
        );
        break;
    case "FileUpload":
        const fileInputRef = useRef<HTMLInputElement>(null);
        const [fileError, setFileError] = useState<string | null>(null);
        const currentFiles: File[] = (value?.value || []) as File[];
        
        const handleFileChange = (files: FileList | null) => {
            if (!files || files.length === 0) return;
            
            let allFiles: File[] = element.multiple ? [...currentFiles] : [];
            let error = null;

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                 if (element.allowedFileTypes && element.allowedFileTypes.length > 0 && element.allowedFileTypes[0] !== '') {
                    if (!element.allowedFileTypes.includes(file.type)) {
                        error = `Invalid file type: ${file.name}. Allowed: ${element.allowedFileTypes.join(', ')}`;
                        continue;
                    }
                }
                if (element.maxFileSize && file.size > element.maxFileSize * 1024 * 1024) {
                    error = `File is too large: ${file.name}. Max size: ${element.maxFileSize}MB`;
                    continue;
                }
                allFiles.push(file);
            }
            setFileError(error);
            onValueChange(element.id, allFiles);
        };
        
        const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            e.stopPropagation();
            handleFileChange(e.dataTransfer.files);
        }

        const removeFile = (index: number) => {
            const newFiles = [...currentFiles];
            newFiles.splice(index, 1);
            onValueChange(element.id, newFiles);
        }
        
        content = (
            <div>
                {renderLabel()}
                <div 
                    className={cn(
                        "relative flex flex-col items-center justify-center w-full border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-accent/50",
                        currentFiles.length === 0 ? "h-32" : "min-h-32 p-4"
                    )}
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={(e) => handleFileChange(e.target.files)}
                        accept={element.allowedFileTypes?.join(',')}
                        multiple={element.multiple}
                    />
                    {currentFiles.length > 0 ? (
                        <div className="w-full space-y-2">
                             {currentFiles.map((file, index) => (
                                <div key={index} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <FileIcon className="h-5 w-5 text-muted-foreground" />
                                        <div className="flex flex-col overflow-hidden">
                                            <p className="font-semibold text-sm truncate">{file.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {(file.size / 1024 / 1024).toFixed(2)} MB
                                            </p>
                                        </div>
                                    </div>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-7 w-7 text-destructive hover:text-destructive"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeFile(index);
                                        }}
                                    >
                                        <X className="h-4 w-4"/>
                                    </Button>
                                </div>
                             ))}
                             {element.multiple && (
                                <Button variant="outline" size="sm" className="w-full mt-2">Add more files...</Button>
                             )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                            <p className="mb-2 text-sm text-muted-foreground">
                                <span className="font-semibold">Click to upload</span> or drag and drop
                            </p>
                            {element.allowedFileTypes && element.allowedFileTypes.length > 0 && element.allowedFileTypes[0] !== '' && (
                                <p className="text-xs text-muted-foreground">
                                   {element.allowedFileTypes.map(t => t.split('/')[1]).join(', ').toUpperCase()} up to {element.maxFileSize || 5}MB
                                </p>
                            )}
                        </div>
                    )}
                </div>
                 {fileError && <p className="text-sm text-destructive mt-1">{fileError}</p>}
                 {helperText && <p className="text-sm text-muted-foreground mt-1">{helperText}</p>}
            </div>
        )
        break;
    default:
      content = <div>Unsupported element type: {type}</div>;
      break;
  }

  return <div className={cn(isParentHorizontal && 'flex-1')}>{content}</div>;
}


