

"use client";

import { FormElementInstance, Rule, Condition, Section, TableColumn } from "@/lib/types";
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
import { useEffect, useState, useMemo, useCallback } from "react";
import { fetchFromApi } from "@/services/api";
import { Popup } from "@/components/ui/popup";
import { Button } from "@/components/ui/button";
import { icons, Info, Plus, Trash, ChevronDown, AlertCircle, Loader2, Link } from "lucide-react";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LexicalEditor } from "@/components/lexical/lexical-editor";
import { evaluate } from "@/lib/formula-parser";
import { cn, getAllElements, getNestedValue } from "@/lib/utils";
import { useBuilder } from "@/hooks/use-builder";
import { evaluateRule } from "@/components/form-preview-helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { DataGrid } from "@/components/ui/data-grid";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";


type Props = {
  element: FormElementInstance;
  value: any;
  onValueChange: (id: string, value: any, fullObject?: any) => void;
  formState?: { [key: string]: any };
  isParentHorizontal?: boolean;
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


export function FormElementRenderer({ element, value, onValueChange, formState, isParentHorizontal }: Props) {
  const { rules, sections } = useBuilder();
  const [dynamicOptions, setDynamicOptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

   const isVisible = useMemo(() => {
    const showRules = rules.filter(r => r.behavior.type === 'show' && r.behavior.targetElementId === element.id);
    const hideRules = rules.filter(r => r.behavior.type === 'hide' && r.behavior.targetElementId === element.id);

    let visible = true;

    // "Show" rules can make a previously hidden-by-rule element visible
    if (showRules.length > 0) {
      if (evaluateRule(showRules[0], formState || {})) {
        visible = true;
      }
    }

    // "Hide" rules can make an element hidden
    if (hideRules.length > 0) {
      if (evaluateRule(hideRules[0], formState || {})) {
        visible = false;
      }
    }
    
    return visible;
  }, [element.id, formState, rules]);
  
 const isDisabled = useMemo(() => {
    if (!formState) return false;
    
    const disableRules = rules.filter(r => r.behavior.type === 'disable' && r.behavior.targetElementId === element.id);
    if (disableRules.some(r => evaluateRule(r, formState))) {
      return true;
    }

    const enableRules = rules.filter(r => r.behavior.type === 'enable' && r.behavior.targetElementId === element.id);
    if (enableRules.length > 0) {
      return !enableRules.some(r => evaluateRule(r, formState));
    }

    return false;
  }, [element.id, formState, rules]);

  const appliedStyles = useMemo(() => {
    const style: React.CSSProperties = {};
    let error: string | null = null;
    if (!formState) return { style, error };
    
    for (const rule of rules) {
        if (rule.behavior.targetElementId === element.id) {
            const isRuleMet = evaluateRule(rule, formState);

            if (isRuleMet) {
                switch(rule.behavior.type) {
                    case 'change_color':
                        if (rule.behavior.targetProperty && rule.behavior.color) {
                            style[rule.behavior.targetProperty as any] = rule.behavior.color;
                        }
                        break;
                    case 'set_error':
                        error = rule.behavior.message || "Invalid input.";
                        break;
                }
            }
        }
    }
    return { style, error };
  }, [element.id, formState, rules]);
  
  const allElements = useMemo(() => getAllElements(sections), [sections]);

  useEffect(() => {
    if (element.type === 'Select' && element.dataSource === 'dynamic') {
      
      // Handle 'parent' dependency type
      if (element.dependencyType === 'parent' && element.dependentFieldId && element.subKey) {
        const parentValue = formState?.[element.dependentFieldId];
        if (parentValue?.fullObject) {
            const subArray = getNestedValue(parentValue.fullObject, element.subKey);
            if (Array.isArray(subArray)) {
                setDynamicOptions(subArray);
            } else {
                setDynamicOptions([]);
            }
        } else {
            setDynamicOptions([]);
        }
        return; // Stop here for 'parent' dependency type
      }
      
      // Handle 'api' dependency type or no dependency
      if (element.apiUrl) {
        let finalApiUrl = element.apiUrl;

        if (element.dependentFieldId && formState) {
          const dependentField = allElements.find(el => el.id === element.dependentFieldId);
          const dependentValue = formState[element.dependentFieldId]?.value;
          
          if (dependentField && 'key' in dependentField && dependentValue) {
              finalApiUrl = finalApiUrl.replace(`{${dependentField.key}}`, encodeURIComponent(dependentValue));
          } else {
              setDynamicOptions([]);
              return; // Don't fetch if dependent value is missing
          }
        }

        setIsLoading(true);
        fetchFromApi(finalApiUrl)
          .then(data => setDynamicOptions(data || []))
          .finally(() => setIsLoading(false));
      }
    }
  }, [element, formState, allElements]);

  const { type, label, required, placeholder, helperText, options, dataSourceConfig, popup, inputFormat, dependentFieldId, isLink, linkUrl, textStyle } = element;

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

  const renderLabel = () => (
    <div className="flex justify-between items-center mb-2">
      <Label className="text-[0.9rem]" style={appliedStyles.style}>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
    </div>
  );

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
    case "Title":
      content = <h2 className="text-2xl font-bold" style={appliedStyles.style}>{label}</h2>;
      break;
    case "Separator":
      content = <Separator />;
      break;
    case "Display": {
      let displayValue = label;
      if (dataSourceConfig?.sourceElementId && formState) {
          const sourceObject = formState[dataSourceConfig.sourceElementId]?.fullObject;
          if (sourceObject) {
              displayValue = getNestedValue(sourceObject, dataSourceConfig.displayKey) || label;
          }
      }
      
      if (isLink && linkUrl) {
          const finalUrl = interpolateString(linkUrl, { formState: formState || {}, sections });
          return (
                 <a href={finalUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 mt-1 text-primary cursor-pointer hover:underline">
                    <Link className="h-4 w-4" />
                    <span className="text-sm">{displayValue}</span>
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
      content = <Tag className={cn(classes[style], 'mt-1')} style={appliedStyles.style}>{displayValue}</Tag>;
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
            val = val.replace(/[^0-9]/g, '');
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
            disabled={isDisabled}
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
          <LexicalEditor
            initialValue={value}
            onChange={(html) => onValueChange(element.id, html)}
          />
          {helperText && (
            <p className="text-sm text-muted-foreground mt-1">{helperText}</p>
          )}
          {renderError()}
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

        const isDependentAndParentNotSelected = dependentFieldId && !formState?.[dependentFieldId]?.value;

      content = (
        <div>
          {renderLabel()}
          <Select value={value} onValueChange={handleSelectChange} disabled={isDisabled || isDependentAndParentNotSelected}>
            <SelectTrigger style={appliedStyles.style} className={cn(appliedStyles.error && "border-destructive")}>
              <SelectValue placeholder={isLoading ? "Loading..." : (isDependentAndParentNotSelected ? "Select parent first" : placeholder)} />
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
          <div className="flex gap-2">
            <Calendar 
              mode="single"
              selected={dateValue}
              onSelect={handleDateChange}
              className={cn("p-0 border rounded-md", appliedStyles.error && "border-destructive")}
            />
            <Input 
              type="time"
              value={timeValue}
              onChange={handleTimeChange}
              className={cn("w-32", appliedStyles.error && "border-destructive")}
            />
          </div>
          {helperText && (
            <p className="text-sm text-muted-foreground mt-1">{helperText}</p>
          )}
          {renderError()}
        </div>
      );
      break;
    case "DataGrid":
        content = (
            <div>
                {renderLabel()}
                <DataGrid
                    apiUrl={element.apiUrl || ""}
                    columns={element.columns || []}
                    paginationEnabled={element.paginationEnabled}
                    pageSize={element.pageSize}
                />
            </div>
        );
        break;
    case "Table":
        const tableValue = value as any[] || [];
        const numDefaultRows = element.defaultRows || 0;
        const tableRows = tableValue.length > 0 ? tableValue : Array(numDefaultRows).fill({});
        
        const handleRowValueChange = (rowIndex: number, columnKey: string, cellValue: any) => {
            let newRows = [...tableRows];
            if (!newRows[rowIndex]) {
                newRows[rowIndex] = {};
            }
            newRows[rowIndex][columnKey] = cellValue;

            // Recalculate formula fields in the same row
            element.tableColumns?.forEach(col => {
                if (col.formula) {
                    const formulaResult = evaluate(col.formula, newRows[rowIndex]);
                    newRows[rowIndex][col.key] = formulaResult;
                }
            })

            onValueChange(element.id, newRows);
        }
        const handleAddRow = () => {
            const newRow = {};
            onValueChange(element.id, [...tableRows, newRow]);
        }
        const handleDeleteRow = (rowIndex: number) => {
            const newRows = tableRows.filter((_, i) => i !== rowIndex);
            onValueChange(element.id, newRows);
        }

        content = (
            <div>
                {renderLabel()}
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {element.tableColumns?.map(col => <TableHead key={col.id}>{col.label}</TableHead>)}
                                {element.canAddRows && <TableHead className="w-[50px]"></TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tableRows.map((row, rowIndex) => (
                                <TableRow key={rowIndex}>
                                    {element.tableColumns?.map(col => {
                                        const cellId = `${element.id}-${rowIndex}-${col.key}`;
                                        let cellValue = row[col.key];

                                        if (col.formula) {
                                          const calculatedValue = evaluate(col.formula, row);
                                          cellValue = calculatedValue;
                                          // Note: We are not calling onValueChange here to prevent potential infinite loops.
                                          // The value is directly used for rendering. The state update will consolidate all changes.
                                        }

                                        // create a sub-state for the row to pass to rule engine
                                        const rowFormState = { ...formState };
                                        element.tableColumns?.forEach(c => {
                                          if (row[c.key]) {
                                            rowFormState[c.element.id] = { value: row[c.key] };
                                          }
                                        });

                                        if (col.formula) {
                                            return (
                                                <TableCell key={cellId}>
                                                    <Input readOnly value={cellValue} className="border-none bg-transparent" />
                                                </TableCell>
                                            )
                                        }

                                        return (
                                        <TableCell key={cellId}>
                                            <FormElementRenderer 
                                                element={{...col.element, id: cellId}} // Unique ID for each cell
                                                value={cellValue}
                                                onValueChange={(_id, val) => handleRowValueChange(rowIndex, col.key, val)}
                                                formState={rowFormState}
                                            />
                                        </TableCell>
                                    )})}
                                     {element.canAddRows && (
                                        <TableCell>
                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteRow(rowIndex)}>
                                                <Trash className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                 {element.canAddRows && (
                    <Button variant="outline" size="sm" className="mt-2" onClick={handleAddRow}>
                        <Plus className="h-4 w-4 mr-2"/>
                        Add Row
                    </Button>
                )}
            </div>
        );
        break;
    default:
      content = <div>Unsupported element type: {type}</div>;
      break;
  }

  return <div className={cn(isParentHorizontal && 'flex-1')}>{content}</div>;
}
