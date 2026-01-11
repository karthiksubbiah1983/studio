

"use client";

import { FormElementInstance, Rule, Condition, Section, ListItemElement, Configuration, TableColumn } from "@/lib/types";
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
import { icons, Info, Plus, Trash, ChevronDown, AlertCircle, Loader2, Link, Eye, Upload, X, File as FileIcon, Search, ChevronLeft, ChevronRight, CalendarDays, Edit, ChevronsUpDown, Check } from "lucide-react";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LexicalEditor } from "@/components/lexical/lexical-editor";
import { evaluate } from "@/lib/formula-parser";
import { cn, findFirstArray, getAllElements, getNestedValue } from "@/lib/utils";
import { evaluateRule } from "@/components/form-preview-helpers";
import { useBuilder } from "@/hooks/use-builder";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { FormPreviewPopup } from "./form-preview-popup";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { EditableTable } from "@/components/builder/editable-table";


type Props = {
  element: FormElementInstance;
  value: any;
  onValueChange: (id: string, value: any, fullObject?: any) => void;
  formState?: { [key: string]: any };
  isParentHorizontal?: boolean;
  isTableCell?: boolean;
  rowContext?: any;
};

const interpolateString = (template: string, data: { [key: string]: any }): string => {
    if (!template) return "";

    // Regex to find all {key} placeholders
    return template.replace(/\{([a-zA-Z0-9_.]+)\}/g, (match, key) => {
        const value = getNestedValue(data, key);
        // If the key exists in the data, replace it. Otherwise, keep the placeholder.
        return value !== undefined ? String(value) : match;
    });
}


export function FormElementRenderer({ element, value: initialValue, onValueChange, formState, isParentHorizontal, isTableCell, rowContext }: Props) {
  const { rules, sections, configurations, updateFormState } = useBuilder();
  const { user } = useAuth();
  const [dynamicOptions, setDynamicOptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isPreviewPopupOpen, setIsPreviewPopupOpen] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState<Date | null>(null);
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [comboboxInputValue, setComboboxInputValue] = useState(initialValue || '');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  
  // Local state for text-based inputs to improve performance
  const [localValue, setLocalValue] = useState(initialValue || "");

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Sync local state when the global state (initialValue) changes from rules or external updates
    setLocalValue(initialValue || "");
  }, [initialValue]);

  const evaluationContext = isTableCell ? rowContext : formState;
  const allElements = useMemo(() => getAllElements(sections), [sections]);

  const value = useMemo(() => {
    let finalValue = initialValue;

    // If the initial value is an object like { value: '...'}, extract the inner value.
    // This handles cases where a rule sets a value inside an editable table cell.
    if (typeof finalValue === 'object' && finalValue !== null && 'value' in finalValue && Object.keys(finalValue).length === 1) {
        finalValue = finalValue.value;
    }

    if ((element.type === 'Input' || element.type === 'Display') && element.formula && evaluationContext) {
      try {
        const calculatedValue = evaluate(element.formula, evaluationContext, allElements);
         if (calculatedValue !== finalValue) {
            onValueChange(element.id, calculatedValue);
            return calculatedValue;
        }
      } catch (e) {
        console.error("Formula evaluation error:", e);
        const errorValue = "#ERROR!";
        if (errorValue !== finalValue) {
            onValueChange(element.id, errorValue);
        }
        return errorValue;
      }
    }
    return finalValue;
  }, [element.type, element.formula, element.id, evaluationContext, initialValue, onValueChange, allElements]);
  
  const isVisible = useMemo(() => {
    let contextToCheck = evaluationContext;
    if(isTableCell) {
        contextToCheck = rowContext;
    }

    if (!contextToCheck) return !element.hidden;

    const showRules = rules.filter(rule => rule?.behaviors?.some(b => b.type === 'show' && b.targetElementId === element.id));
    const hideRules = rules.filter(rule => rule?.behaviors?.some(b => b.type === 'hide' && b.targetElementId === element.id));
    
    let visible = !element.hidden;

    if (showRules.length > 0) {
        visible = showRules.some(r => evaluateRule(r, contextToCheck, configurations, sections));
    }
    
    if (visible && hideRules.length > 0) {
      if (hideRules.some(r => evaluateRule(r, contextToCheck, configurations, sections))) {
        visible = false;
      }
    }
    
    return visible;
  }, [evaluationContext, rowContext, isTableCell, element.id, element.hidden, rules, configurations, sections]);


  const isDisabled = useMemo(() => {
    if (!evaluationContext || !rules) return false;
    const disableRules = rules.filter(rule => rule?.behaviors?.some(b => b.type === 'disable' && b.targetElementId === element.id));
    if (disableRules.some(r => evaluateRule(r, evaluationContext, configurations, sections))) {
      return true;
    }

    const enableRules = rules.filter(rule => rule?.behaviors?.some(b => b.type === 'enable' && b.targetElementId === element.id));
    if (enableRules.length > 0) {
      return !enableRules.some(r => evaluateRule(r, evaluationContext, configurations, sections));
    }

    return false;
  }, [element.id, evaluationContext, rules, configurations, sections]);

  const isReadOnly = useMemo(() => {
    if (element.readOnly) return true;
    if ((element.type === 'Input' || element.type === 'Display') && element.formula && evaluationContext) return true;
    if (rules.some(rule => rule.behaviors.some(b => b.type === 'set_value' && b.targetElementId === element.id && evaluateRule(rule, evaluationContext, configurations, sections)))) {
        return true;
    }
    return false;
  }, [element, evaluationContext, rules, configurations, sections]);
  
  const appliedStyles = useMemo(() => {
    const style: React.CSSProperties = {};
    let error: string | null = null;
    if (!evaluationContext || !rules) return { style, error };

    for (const rule of rules) {
        const isRuleMet = evaluateRule(rule, evaluationContext, configurations, sections);

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
  }, [element.id, evaluationContext, rules, configurations, sections]);

  const isCheckbox = useMemo(() => element.type === 'List' && element.listType === 'checkbox', [element.type, element.listType]);
  const isRadio = useMemo(() => element.type === 'List' && element.listType === 'radio', [element.type, element.listType]);
  const isDisplayOnly = useMemo(() => element.type === 'List' && element.listType === 'display', [element.type, element.listType]);

  const currentSelection = useMemo(() => {
    if (element.type !== 'List') return null;
    return isCheckbox ? (Array.isArray(initialValue) ? initialValue : []) : (initialValue || '');
  }, [element.type, isCheckbox, initialValue]);

  const allListOptions = useMemo(() => {
    if (element.type !== 'List') return [];
    if (element.dataSource === 'dynamic') return dynamicOptions;
    if (element.dataSource === 'static') return element.staticData || [];
    return [];
  }, [element, dynamicOptions]);

  const mainListOptions = useMemo(() => {
      if (element.type !== 'List' || !currentSelection) return allListOptions;
      if (element.displaySelection === 'selected' && !isDisplayOnly) {
          return allListOptions.filter(option => {
              const optValue = String(typeof option === 'object' ? getNestedValue(option, element.valueKey!) : option);
              return isCheckbox ? !currentSelection.includes(optValue) : currentSelection !== optValue;
          });
      }
      return allListOptions;
  }, [allListOptions, currentSelection, isCheckbox, isDisplayOnly, element]);

  const displayedSelection = useMemo(() => {
      if (element.type !== 'List' || element.displaySelection === 'none' || !currentSelection || isDisplayOnly) {
          return [];
      }
      if (element.displaySelection === 'selected') {
           return allListOptions.filter(option => {
              const itemValue = String(typeof option === 'object' ? getNestedValue(option, element.valueKey!) : option.id);
              return isCheckbox ? currentSelection.includes(itemValue) : currentSelection === itemValue;
          });
      }
      return [];
  }, [allListOptions, currentSelection, isCheckbox, isDisplayOnly, element]);
  

  useEffect(() => {
    setCurrentDateTime(new Date());
    const timer = setInterval(() => setCurrentDateTime(new Date()), 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);
  

  useEffect(() => {
    if (element.type !== 'Select' && element.type !== 'List' && element.type !== 'Combobox') {
      return;
    }

    if (element.dataSource === 'dynamic' && element.apiUrl) {
      let finalApiUrl = element.apiUrl;

      // Handle templated URLs based on parent selection
      if (element.dataSourceParentId && finalApiUrl.includes('{')) {
        const parentState = formState?.[element.dataSourceParentId];
        const parentValue = parentState?.value;
        if (parentValue) {
          const placeholder = finalApiUrl.substring(finalApiUrl.indexOf('{') + 1, finalApiUrl.indexOf('}'));
          // Get the corresponding parent object to interpolate any of its keys
          const parentFullObject = parentState?.fullObject;
          const valueToInterpolate = parentFullObject ? getNestedValue(parentFullObject, placeholder) : parentValue;
          finalApiUrl = finalApiUrl.replace(`{${placeholder}}`, valueToInterpolate);
        } else {
          // If parent has no value, don't fetch. Clear options.
          setDynamicOptions([]);
          return;
        }
      }

      if (finalApiUrl && !finalApiUrl.includes('{')) { // Don't fetch if placeholder is not replaced
          setIsLoading(true);
          fetchFromApi(finalApiUrl)
              .then(data => {
                  const arrayData = findFirstArray(data);
                  setDynamicOptions(arrayData || []);
              })
              .finally(() => setIsLoading(false));
      } else {
           setDynamicOptions([]); // Clear options if URL becomes invalid
      }
    } else if (element.dataSource === 'fromParent' && element.dataSourceParentId) {
        const parentState = formState?.[element.dataSourceParentId];
        if (parentState?.fullObject && element.dataSourceParentKey) {
            const subList = getNestedValue(parentState.fullObject, element.dataSourceParentKey);
            setDynamicOptions(Array.isArray(subList) ? subList : []);
        } else {
            setDynamicOptions([]);
        }
    }

  }, [element.dataSource, element.apiUrl, element.dataSourceParentId, element.dataSourceParentKey, formState]);


  const { type, label, required, placeholder, helperText, options, dataSourceConfig, popup, inputFormat, isLink, linkUrl, linkUrlSourceElementId, textStyle, color, content: richTextContent, key, direction, leadText, fixedLength, leadingChar, formatType, currency, decimalPlaces, labelDirection, dateValidation, dateValidationRange } = element;

  const PopupIcon = popup?.icon ? (icons as any)[popup.icon] : null;
  
  if (!isVisible) return null;

  const renderLabelWithPopup = (dynamicLabel?: string) => {
    let finalLabel = dynamicLabel || label;

    if (isTableCell && !finalLabel) return null; // Don't render empty labels in table cells

    return (
        <div className="flex items-center gap-2">
           <Label className="text-[0.9rem]" style={appliedStyles.style}>
            {finalLabel}
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
}

  const renderLabel = () => {
    if (!label) return null;
    const finalLabelDirection = labelDirection || 'vertical';

    return (
        <div className={cn("flex justify-between items-center", finalLabelDirection === 'vertical' && 'mb-2')}>
        <Label className={cn("text-[0.9rem]", finalLabelDirection === 'horizontal' && 'w-1/3')} style={appliedStyles.style}>
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
      if (element.formula) {
          finalDisplayValue = value; // Use the formula-calculated value
      } else if (dataSourceConfig?.sourceType === 'currentUser' && user) {
          finalDisplayValue = getNestedValue(user, dataSourceConfig.displayKey);
      } else if (dataSourceConfig?.sourceType === 'currentDateTime' && currentDateTime) {
          finalDisplayValue = format(currentDateTime, 'PPP p');
      } else if (dataSourceConfig?.sourceType === 'field' && dataSourceConfig?.sourceElementId && formState) {
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
        
      if (isLink) {
          let finalUrl = "";
          const interpolationContext = rowContext || formState || {};
          // In a list context, the row data (rowContext) might contain the specific URL
          if (rowContext && key && rowContext[`${key}__url`]) {
              finalUrl = rowContext[`${key}__url`];
          } 
          // Fallback to the element's configured URL template
          else if (linkUrl) {
              finalUrl = interpolateString(linkUrl, interpolationContext);
          }
          return (
              <a href={finalUrl || '#'} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 mt-1 text-primary cursor-pointer hover:underline">
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
      
      let formattedValue = String(finalDisplayValue);
      const numValue = parseFloat(finalDisplayValue);
      if (!isNaN(numValue)) {
        try {
          if (formatType === 'currency') {
            formattedValue = new Intl.NumberFormat(undefined, {
              style: 'currency',
              currency: currency || 'USD',
              minimumFractionDigits: decimalPlaces ?? 2,
              maximumFractionDigits: decimalPlaces ?? 2,
            }).format(numValue);
          } else if (formatType === 'percentage') {
            formattedValue = new Intl.NumberFormat(undefined, {
              style: 'percent',
              minimumFractionDigits: decimalPlaces ?? 0,
              maximumFractionDigits: decimalPlaces ?? 0,
            }).format(numValue / 100); // Assume input is 0-100 for percentage
          } else if (formatType === 'decimal') {
            formattedValue = new Intl.NumberFormat(undefined, {
              style: 'decimal',
              minimumFractionDigits: decimalPlaces ?? 2,
              maximumFractionDigits: decimalPlaces ?? 2,
            }).format(numValue);
          }
        } catch (e) {
            console.error("Error formatting value:", e);
            // Fallback to string value
        }
      }

      const mainTextContent = <Tag className={cn(classes[style], 'px-1.5 py-1')} style={finalStyle}>{formattedValue}</Tag>;

      content = (
           <div className={cn(
              "flex items-center gap-2",
              direction === 'vertical' && 'flex-col items-start'
           )}>
              {leadText && <span className="text-sm text-muted-foreground">{leadText}</span>}
              {mainTextContent}
          </div>
      );
      break;
    }
    case "Container": {
        const { elements, direction, justify, align, width } = element;
        const containerStyle = { ...appliedStyles.style, width: width || 'auto' };
        content = (
            <div style={containerStyle} className={cn("flex gap-4",
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
      const handleLocalInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value;
        if (inputFormat === 'number') {
            val = val.replace(/[^0-9.]/g, '');
        } else if (inputFormat === 'alphanumeric') {
            val = val.replace(/[^a-zA-Z0-9]/g, '');
        }
        setLocalValue(val);
      };
      
      const handleBlur = (e: React.ChangeEvent<HTMLInputElement>) => {
        let finalValue = localValue;
        if (inputFormat === 'number' && fixedLength && leadingChar && finalValue.length > 0 && finalValue.length < fixedLength) {
            finalValue = finalValue.padStart(fixedLength, leadingChar);
        }
        onValueChange(element.id, finalValue);
      }

       const finalLabelDirection = labelDirection || 'vertical';

      content = (
        <div className={cn(finalLabelDirection === 'horizontal' && 'flex items-center gap-4')}>
          {renderLabel()}
          <div className={cn(finalLabelDirection === 'horizontal' && 'flex-1')}>
            <Input 
              placeholder={placeholder}
              value={isReadOnly ? (element.defaultValue || '') : localValue}
              onChange={handleLocalInputChange}
              onBlur={handleBlur}
              style={appliedStyles.style}
              className={cn(appliedStyles.error && "border-destructive")}
              disabled={isDisabled}
              readOnly={isReadOnly}
            />
            {helperText && (
              <p className="text-sm text-muted-foreground mt-1">{helperText}</p>
            )}
            {renderError()}
          </div>
        </div>
      );
      break;
    case "Textarea":
       const handleLocalTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            setLocalValue(e.target.value);
        };

        const handleTextareaBlur = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            onValueChange(element.id, e.target.value);
        };
      content = (
        <div>
          {renderLabel()}
          <Textarea 
            placeholder={placeholder}
            value={localValue}
            onChange={handleLocalTextareaChange}
            onBlur={handleTextareaBlur}
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
            if (element.dataSource === 'dynamic' || (element.dataSource === 'fromParent' && dynamicOptions.length > 0)) {
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
              {element.dataSource === 'dynamic' || element.dataSource === 'fromParent' ? (
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
    case "Combobox": {
      const handleComboboxSelect = (currentValue: string) => {
        const newValue = currentValue === value ? "" : currentValue;
        onValueChange(element.id, newValue);
        setComboboxInputValue(newValue);
        setComboboxOpen(false);
      };
      
       const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setComboboxInputValue(e.target.value);
        onValueChange(element.id, e.target.value); // Allow free text entry
      };
      
      let currentOptions = element.dataSource === 'dynamic' ? dynamicOptions : (options || []);

      const filteredOptions = currentOptions.filter(option => {
          const label = typeof option === 'object' ? getNestedValue(option, element.labelKey!) : option;
          return label.toLowerCase().includes(comboboxInputValue.toLowerCase());
      });
      
      const getDisplayValue = () => {
          if (element.dataSource === 'dynamic') {
              const selectedOption = currentOptions.find(opt => String(getNestedValue(opt, element.valueKey!)) === value);
              return selectedOption ? getNestedValue(selectedOption, element.labelKey!) : value;
          }
          return value;
      }
      
      content = (
        <div>
          {renderLabel()}
            <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                <PopoverTrigger asChild>
                    <div className="relative">
                        <Input
                            value={comboboxInputValue}
                            onChange={handleInputChange}
                            placeholder={placeholder}
                            className="pr-8"
                        />
                        <ChevronsUpDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 shrink-0 opacity-50" />
                    </div>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                    <Command>
                        <CommandList>
                             {isLoading ? (
                                <div className="p-2 flex justify-center"><Loader2 className="h-4 w-4 animate-spin"/></div>
                             ) : (
                                <>
                                    <CommandEmpty>No results found.</CommandEmpty>
                                    <CommandGroup>
                                        {filteredOptions.map((option, index) => {
                                             const optionValue = String(typeof option === 'object' ? getNestedValue(option, element.valueKey!) : option);
                                             const optionLabel = String(typeof option === 'object' ? getNestedValue(option, element.labelKey!) : option);
                                             return (
                                                <CommandItem
                                                    key={index}
                                                    value={optionLabel}
                                                    onSelect={() => handleComboboxSelect(optionValue)}
                                                >
                                                    <Check className={cn("mr-2 h-4 w-4", value === optionValue ? "opacity-100" : "opacity-0")} />
                                                    {optionLabel}
                                                </CommandItem>
                                            )
                                        })}
                                    </CommandGroup>
                                </>
                             )}
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
           {helperText && (<p className="text-sm text-muted-foreground mt-1">{helperText}</p>)}
        </div>
      );
      break;
    }
    case "List": {
        if (currentSelection === null) break;
        const handleListChange = (itemValue: string) => {
            if (isDisplayOnly) return;
            if (isCheckbox) {
                const selection = currentSelection as string[];
                const newSelection = selection.includes(itemValue)
                    ? selection.filter((v: string) => v !== itemValue)
                    : [...selection, itemValue];
                onValueChange(element.id, newSelection);
            } else {
                onValueChange(element.id, itemValue);
            }
        };
        
        const renderListItemContent = (option: any) => {
            const itemLabel = String(element.dataSource === 'dynamic' ? getNestedValue(option, element.labelKey!) : option.label);
            const secondaryText = element.hasSecondaryText ? String(element.dataSource === 'dynamic' ? getNestedValue(option, element.secondaryTextKey!) : option.secondaryText) : null;
            const linkUrlValue = (element.isSecondaryTextLink
                ? (element.dataSource === 'dynamic' ? getNestedValue(option, element.linkUrlKey!) : option.linkUrl)
                : null) || '#';

            return (
                <div className="flex items-center gap-6">
                    <Label className="font-normal cursor-pointer">{itemLabel}</Label>
                     {secondaryText && (
                        element.isSecondaryTextLink ? (
                            <a href={linkUrlValue} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary cursor-pointer hover:underline text-sm">
                                <Link className="h-3 w-3" />
                                {secondaryText}
                            </a>
                        ) : (
                            <p className="text-sm text-muted-foreground">{secondaryText}</p>
                        )
                    )}
                </div>
            );
        };
        
        const listContent = (
            <div className="rounded-md border p-2 space-y-2">
                {isLoading ? (
                    <Loader2 className="animate-spin" />
                ) : mainListOptions.length > 0 ? (
                    mainListOptions.map((option, index) => {
                        const itemValue = String(element.dataSource === 'dynamic' ? getNestedValue(option, element.valueKey!) : option.id);
                        const isSelected = isCheckbox ? (currentSelection as string[]).includes(itemValue) : currentSelection === itemValue;
                        
                        return (
                            <div
                                key={`${element.id}-item-${index}`}
                                onClick={() => handleListChange(itemValue)}
                                className={cn(
                                    "flex items-start gap-3 p-3 rounded-md transition-colors",
                                    !isDisplayOnly && "cursor-pointer",
                                    isSelected ? "bg-primary/10 border-primary/30" : "hover:bg-accent"
                                )}
                            >
                                {!isDisplayOnly && (
                                    <div className="flex-shrink-0 pt-0.5">
                                        {isCheckbox ? <Checkbox checked={isSelected} readOnly /> : <RadioGroupItem value={itemValue} id={`${element.id}-${index}`} />}
                                    </div>
                                )}
                                <div className="flex-1">
                                    {renderListItemContent(option)}
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center text-sm text-muted-foreground p-4">
                        No More Items
                    </div>
                )}
            </div>
        );

        const handleRemoveSelection = (itemValue: string) => {
            if (isCheckbox) {
                const selection = currentSelection as string[];
                const newSelection = selection.filter((v: string) => v !== itemValue);
                onValueChange(element.id, newSelection);
            } else { // Radio button
                onValueChange(element.id, '');
            }
        };
        
        content = (
            <div>
                {renderLabel()}
                {isRadio ? (
                    <RadioGroup id={element.id} value={initialValue} onValueChange={handleListChange}>
                        {listContent}
                    </RadioGroup>
                ) : (
                    listContent
                )}
                 {element.displaySelection !== 'none' && displayedSelection.length > 0 && !isDisplayOnly && (
                    <div className="mt-4">
                        <p className="text-sm font-medium mb-2">{element.displaySelection === 'selected' ? 'Selected' : 'Unselected'} Items:</p>
                        <div className="rounded-md border p-2 space-y-1">
                            {displayedSelection.map((option, index) => {
                                 const itemValue = String(element.dataSource === 'dynamic' ? getNestedValue(option, element.valueKey!) : option.id);
                                 return (
                                    <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded-md text-sm">
                                        <div className="flex-1">{renderListItemContent(option)}</div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                            onClick={() => handleRemoveSelection(itemValue)}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                 )
                            })}
                        </div>
                    </div>
                 )}
            </div>
        );
        break;
    }
    case "Checkbox": {
        const isChecked = value === true;
        const handleCheckedChange = (checked: boolean) => {
            onValueChange(element.id, checked);
        };
        
        content = (
            <div className="flex items-start space-x-2">
                <Checkbox
                    id={element.id}
                    checked={isChecked}
                    onCheckedChange={handleCheckedChange}
                    disabled={isDisabled}
                />
                <div className="grid gap-1.5 leading-none">
                    {renderLabelWithPopup(label)}
                    {helperText && <p className="text-sm text-muted-foreground mt-1">{helperText}</p>}
                    {renderError()}
                </div>
            </div>
        );
        break;
    }
    case "RadioGroup":
      content = (
        <div id={element.id}>
          {renderLabelWithPopup()}
          <RadioGroup 
            value={value}
            onValueChange={(val) => onValueChange(element.id, val)}
            className={cn("mt-3", direction === 'horizontal' ? "flex flex-row gap-4" : "grid gap-2")}
            disabled={isDisabled}
          >
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
      const [dateValue, setDateValue] = useState<Date | undefined>(undefined);
      const [timeValue, setTimeValue] = useState('');
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const disabledDays = useMemo(() => {
        if (dateValidation === 'noFuture') return { after: today };
        if (dateValidation === 'noPast') return { before: today };
        if (dateValidation === 'dateRange' && dateValidationRange) {
          const from = dateValidationRange.from ? new Date(dateValidationRange.from) : undefined;
          const to = dateValidationRange.to ? new Date(dateValidationRange.to) : undefined;
          if (from) from.setHours(0,0,0,0);
          if (to) to.setHours(23,59,59,999);
          return { before: from, after: to };
        }
        return undefined;
      }, [dateValidation, dateValidationRange, today]);

      useEffect(() => {
        if(value) {
            const date = new Date(value);
            setDateValue(date);
            setTimeValue(`${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2, '0')}`);
        } else {
            setDateValue(undefined);
            setTimeValue('');
        }
      }, [value]);
      
      const handleDateChange = (date: Date | undefined) => {
        if (!isClient) return;
        const newDate = dateValue || currentDateTime || new Date();
        if(date) {
            newDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
            onValueChange(element.id, newDate.toISOString());
        }
      }
      const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!isClient) return;
        const time = e.target.value;
        const [hours, minutes] = time.split(':').map(Number);
        const newDate = dateValue || (currentDateTime || new Date());
        newDate.setHours(hours, minutes);
        onValueChange(element.id, newDate.toISOString());
      }
      
      if (!isClient) {
        return (
          <div>
            {renderLabel()}
            <Button
              variant={"outline"}
              className={cn("w-full justify-start text-left font-normal", !placeholder && "text-muted-foreground")}
            >
              <CalendarDays className="mr-2 h-4 w-4" />
              <span>{placeholder || "Pick a date"}</span>
            </Button>
          </div>
        );
      }

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
                    disabled={disabledDays}
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
        const currentFiles: File[] = (value || []) as File[];
        
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
     case "EditableTable":
        return <EditableTable 
            element={element} 
            value={value} 
            onValueChange={onValueChange}
            formState={formState} 
        />;
    default:
      content = <div>Unsupported element type: {type}</div>;
      break;
  }

  return <div className={cn(!isParentHorizontal && 'flex-1', isTableCell && 'p-0')}>{content}</div>;
}

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

    

    


















