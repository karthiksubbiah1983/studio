
"use client";

import { FormElementInstance, InputTableColumn, Rule, Condition, Section, DataGridColumn } from "@/lib/types";
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
import { Popup } from "../ui/popup";
import { Button } from "../ui/button";
import { icons, Info, Plus, Trash, ChevronDown, AlertCircle, Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { LexicalEditor } from "../lexical/lexical-editor";
import { evaluate } from "@/lib/formula-parser";
import { cn } from "@/lib/utils";
import { useBuilder } from "@/hooks/use-builder";
import { findElementRecursive, getAllElements, evaluateRule } from "../form-preview-helpers";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";

type Props = {
  element: FormElementInstance;
  value: any;
  onValueChange: (id: string, value: any, fullObject?: any) => void;
  formState?: { [key: string]: any };
  isParentHorizontal?: boolean;
};

const getNestedValue = (obj: any, path: string): any => {
    if (!obj || !path) return undefined;
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

export function FormElementRenderer({ element, value, onValueChange, formState, isParentHorizontal }: Props) {
  const { rules } = useBuilder();
  const [dynamicOptions, setDynamicOptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [tableData, setTableData] = useState<any[]>([]);
  
  const [tableRows, setTableRows] = useState<any[]>([]);

  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});

   const isVisible = useMemo(() => {
    const showRules = rules.filter(r => r.behavior.type === 'show' && r.behavior.targetElementId === element.id);
    const hideRules = rules.filter(r => r.behavior.type === 'hide' && r.behavior.targetElementId === element.id);

    let visible;

    if (showRules.length > 0) {
      visible = showRules.some(r => evaluateRule(r, formState || {}));
    } else {
      visible = !element.hidden;
    }

    if (visible && hideRules.length > 0) {
      if (hideRules.some(r => evaluateRule(r, formState || {}))) {
        visible = false;
      }
    }
    
    return visible;
  }, [element.id, element.hidden, formState, rules]);
  
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

  useEffect(() => {
    if (element.type === 'DataGrid') {
        const initialVisibility = element.columns?.reduce((acc, col) => {
            acc[col.id] = col.visible;
            return acc;
        }, {} as Record<string, boolean>) || {};
        setColumnVisibility(initialVisibility);
    }
     if (element.type === 'InputTable') {
        const initialVisibility = element.inputColumns?.reduce((acc, col) => {
            acc[col.id] = true; // All input columns visible by default
            return acc;
        }, {} as Record<string, boolean>) || {};
        setColumnVisibility(initialVisibility);
    }
  }, [element.columns, element.inputColumns, element.type]);

  useEffect(() => {
    if (element.type === 'Select' && element.dataSource === 'dynamic' && element.apiUrl) {
      setIsLoading(true);
      fetchFromApi(element.apiUrl)
        .then(data => setDynamicOptions(data || []))
        .finally(() => setIsLoading(false));
    }
    if (element.type === 'DataGrid' && element.apiUrl) {
        setIsLoading(true);
        fetchFromApi(element.apiUrl)
            .then(data => {
                if (Array.isArray(data)) {
                    setTableData(data);
                } else {
                    setTableData([]);
                }
            })
            .finally(() => setIsLoading(false));
    }
     if (element.type === 'InputTable') {
        if (value) {
            setTableRows(value);
        } else {
            const initial = Array.from({ length: element.initialRows || 1 }, () => ({ id: crypto.randomUUID() }));
            setTableRows(initial);
            onValueChange(element.id, initial);
        }
    }
  }, [element, value, onValueChange]);

  const { type, label, required, placeholder, helperText, options, dataSourceConfig, popup } = element;

  const LucideIcon = popup?.icon ? (icons as any)[popup.icon] : null;
  
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
                icon={LucideIcon}
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
      if (!dataSourceConfig || !formState) return null;
      const { sourceElementId, displayKey } = dataSourceConfig;
      const sourceObject = formState[sourceElementId]?.fullObject;
      const displayValue = sourceObject ? getNestedValue(sourceObject, displayKey) : `(Not selected)`;
      
      content = (
        <div>
          <Label className="text-[0.9rem]">{label}</Label>
          <p className="text-muted-foreground text-sm mt-1" style={appliedStyles.style}>{displayValue}</p>
        </div>
      );
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
      content = (
        <div>
          {renderLabel()}
          <Input 
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
            const fullObject = dynamicOptions.find(opt => String(getNestedValue(opt, element.valueKey!)) === val);
            onValueChange(element.id, val, fullObject);
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
    case "DataGrid": {
        const { columns } = element;
        const visibleColumns = columns?.filter(c => c.visible) || [];
         content = (
            <div>
                {renderLabel()}
                <div className={cn("rounded-md border", appliedStyles.error && "border-destructive")}>
                    <ScrollArea className="w-full whitespace-nowrap">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    {visibleColumns.map((col) => (
                                        <TableHead key={col.id}>{col.title}</TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={visibleColumns.length} className="h-24 text-center">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                        </TableCell>
                                    </TableRow>
                                ) : tableData.length > 0 ? (
                                    tableData.map((row, rowIndex) => (
                                        <TableRow key={rowIndex}>
                                            {visibleColumns.map((col) => (
                                                <TableCell key={col.id} className="p-2">
                                                    {getNestedValue(row, col.dataKey) || '-'}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : (
                                     <TableRow>
                                        <TableCell colSpan={visibleColumns.length} className="h-24 text-center">
                                            No data to display.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                         <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                </div>
                 {helperText && <p className="text-sm text-muted-foreground mt-1">{helperText}</p>}
                {renderError()}
            </div>
        );
        break;
    }
    case "InputTable": {
        const { inputColumns, allowAdd, allowDelete } = element;

        const handleAddRow = () => {
            const newRow = { id: crypto.randomUUID() };
            const newRows = [...tableRows, newRow];
            setTableRows(newRows);
            onValueChange(element.id, newRows);
        };

        const handleDeleteRow = (rowId: string) => {
            const newRows = tableRows.filter((row) => row.id !== rowId);
            setTableRows(newRows);
            onValueChange(element.id, newRows);
        };

       const handleCellChange = useCallback((rowId: string, colKey: string, cellValue: any, fullObject?: any) => {
            const newRows = tableRows.map(row => {
                if (row.id === rowId) {
                    const newRow = { ...row, [colKey]: cellValue };
                    // Recalculate formulas for the row
                    inputColumns?.forEach(col => {
                        const formula = col.element.description; // Using description for formula
                        if (formula) {
                            try {
                                const result = evaluate(formula, newRow);
                                newRow[col.key] = result;
                            } catch (e) {
                                console.warn(`Error evaluating formula for ${col.key}:`, e);
                                newRow[col.key] = "#ERROR!";
                            }
                        }
                    });
                    return newRow;
                }
                return row;
            });
            setTableRows(newRows);
            onValueChange(element.id, newRows);
        }, [tableRows, onValueChange, element.id, inputColumns]);
        
        content = (
            <div className={cn(isDisabled && 'pointer-events-none opacity-50')}>
                {renderLabel()}
                 <div className={cn("rounded-md border", appliedStyles.error && "border-destructive")}>
                     <ScrollArea className="w-full whitespace-nowrap">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    {inputColumns?.map((col) => (
                                        <TableHead key={col.id} style={{width: col.width}}>{col.title}</TableHead>
                                    ))}
                                    {(allowDelete) && <TableHead className="w-[50px]"> </TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {tableRows.map((row) => (
                                    <TableRow key={row.id}>
                                        {inputColumns?.map((col) => {
                                            const cellElement = col.element;
                                            const cellValue = row[col.key];
                                            const cellId = `${element.id}.${row.id}.${col.key}`; // Unique ID for rules
                                            
                                            const tempCellElement = {
                                                ...cellElement,
                                                id: cellId,
                                                label: '', // Labels are in the header
                                            };
                                            
                                            const cellFormState = {
                                                ...formState,
                                                [cellId]: { value: cellValue }
                                            };
                                            
                                            return (
                                                <TableCell key={col.id} className="p-1 align-top">
                                                    <FormElementRenderer
                                                        element={tempCellElement}
                                                        value={cellValue}
                                                        onValueChange={(_id, val, fullObj) => handleCellChange(row.id, col.key, val, fullObj)}
                                                        formState={cellFormState}
                                                    />
                                                </TableCell>
                                            );
                                        })}
                                        {allowDelete && (
                                            <TableCell className="p-1 align-middle">
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteRow(row.id)}>
                                                    <Trash className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                         <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                </div>
                {allowAdd && (
                    <Button variant="outline" size="sm" className="mt-4" onClick={handleAddRow}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Row
                    </Button>
                )}
                {helperText && <p className="text-sm text-muted-foreground mt-1">{helperText}</p>}
                {renderError()}
            </div>
        );
        break;
    }
    default:
      content = <div>Unsupported element type: {type}</div>;
      break;
  }

  return <div className={cn(isParentHorizontal && 'flex-1')}>{content}</div>;
}
    