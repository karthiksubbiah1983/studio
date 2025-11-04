

"use client";

import { FormElementInstance, TableColumn, Rule, Condition, Section } from "@/lib/types";
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
import { useEffect, useState, useMemo } from "react";
import { fetchFromApi } from "@/services/api";
import { Popup } from "../ui/popup";
import { Button } from "../ui/button";
import { icons, Info, Plus, Trash, ChevronDown, AlertCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { LexicalEditor } from "../lexical/lexical-editor";
import { evaluate } from "@/lib/formula-parser";
import { cn } from "@/lib/utils";
import { useBuilder } from "@/hooks/use-builder";
import { findElementRecursive, getAllElements, evaluateRule } from "../form-preview-helpers";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

type Props = {
  element: FormElementInstance;
  value: any;
  onValueChange: (id: string, value: any, fullObject?: any) => void;
  formState?: { [key: string]: any };
  isParentHorizontal?: boolean;
};

const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

export function FormElementRenderer({ element, value, onValueChange, formState, isParentHorizontal }: Props) {
  const { rules, sections } = useBuilder();
  const [dynamicOptions, setDynamicOptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  
  const [tableRows, setTableRows] = useState<any[][]>([]);

  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});

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
  
 const isDisabled = useMemo(() => {
    if (!formState) return false;

    // A field is disabled if ANY 'disable' rule is met.
    const isExplicitlyDisabled = rules.some(r => 
        r.behavior.type === 'disable' && 
        r.behavior.targetElementId === element.id &&
        evaluateRule(r, formState)
    );

    if (isExplicitlyDisabled) {
        return true;
    }

    // If no 'disable' rules are active, check for 'enable' rules.
    const enableRules = rules.filter(r => 
        r.behavior.type === 'enable' && 
        r.behavior.targetElementId === element.id
    );

    // If 'enable' rules exist, the element is disabled by default unless one of them is met.
    if (enableRules.length > 0) {
        const isEnabled = enableRules.some(r => evaluateRule(r, formState));
        return !isEnabled; // Disabled if no enable rules are met
    }

    // If no disable or enable rules apply, it is not disabled.
    return false;
  }, [element.id, formState, rules]);


  const isVisible = useMemo(() => {
    const showRules = rules.filter(r => r.behavior.type === 'show' && r.behavior.targetElementId === element.id);
    const hideRules = rules.filter(r => r.behavior.type === 'hide' && r.behavior.targetElementId === element.id);
    const currentState = formState || {};
    
    let visible;

    // If "show" rules exist, the element starts as hidden.
    if (showRules.length > 0) {
        visible = showRules.some(r => evaluateRule(r, currentState));
    } else {
        // Otherwise, its default visibility is based on the "hidden" property.
        visible = !element.hidden;
    }

    // "Hide" rules act as a final override. If any are met, the element is hidden.
    if (visible && hideRules.some(r => evaluateRule(r, currentState))) {
        visible = false;
    }
    
    return visible;
}, [element.id, element.hidden, formState, rules]);


  useEffect(() => {
    if (element.type === 'Table') {
        const initialVisibility = element.columns?.reduce((acc, col) => {
            acc[col.id] = col.visible;
            return acc;
        }, {} as Record<string, boolean>) || {};
        setColumnVisibility(initialVisibility);
    }
  }, [element.columns, element.type]);

  useEffect(() => {
    if (element.type === 'Select' && element.dataSource === 'dynamic' && element.apiUrl) {
      setIsLoading(true);
      fetchFromApi(element.apiUrl)
        .then(data => setDynamicOptions(data || []))
        .finally(() => setIsLoading(false));
    }
     if (element.type === 'Table') {
        if (value?.value) {
            setTableRows(value.value);
        } else {
            const initial = Array.from({ length: element.initialRows || 1 }, () => 
                Array(element.columns?.length || 0).fill("")
            );
            setTableRows(initial);
            onValueChange(element.id, initial);
        }
    }
  }, [element, value, onValueChange]);

  const { type, label, required, placeholder, helperText, options, dataSourceConfig, popup } = element;

  const LucideIcon = popup?.icon ? (icons as any)[popup.icon] : null;
  
  const elementId = element?.id;
  const isSection = !type && elementId;
  const sectionIsVisible = useMemo(() => {
    if (!isSection) return true; // Not a section, so don't hide it here.
    const showRules = rules.filter(r => r.behavior.type === 'show' && r.behavior.targetElementId === elementId);
    const hideRules = rules.filter(r => r.behavior.type === 'hide' && r.behavior.targetElementId === elementId);
    const currentState = formState || {};

    let visible;

    if (showRules.length > 0) {
        visible = showRules.some(r => evaluateRule(r, currentState));
    } else {
        visible = !element.hidden;
    }

    if (visible && hideRules.length > 0) {
        if (hideRules.some(r => evaluateRule(r, currentState))) {
            visible = false;
        }
    }
    
    return visible;
  }, [isSection, element, formState, rules, elementId]);


  if (isSection) {
    const section = element as unknown as Section;
    if (!sectionIsVisible) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base font-medium">
                    {section.title}
                </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 grid-cols-1">
                  {section.elements.map(el => (
                    <FormElementRenderer 
                        key={el.id}
                        element={el}
                        value={formState?.[el.id]}
                        onValueChange={onValueChange}
                        formState={formState}
                    />
                  ))}
              </div>
            </CardContent>
          </Card>
    )
  }
  
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
                        value={formState?.[el.id]} 
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
            value={value?.value || ""}
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
            value={value?.value || ""}
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
            initialValue={value?.value}
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
          <Select value={value?.value} onValueChange={handleSelectChange} disabled={isDisabled}>
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
                    checked={value?.value}
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
          <RadioGroup value={value?.value} onValueChange={(val) => onValueChange(element.id, val)} className="mt-3" disabled={isDisabled}>
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
      const dateValue = value?.value ? new Date(value.value) : undefined;
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
    case "Table":
        const { columns, allowAdd, allowEdit, allowDelete } = element;
        const visibleColumns = columns?.filter(c => columnVisibility[c.id]) || [];

        const handleAddRow = () => {
            const newRow = Array(columns?.length || 0).fill("");
            const newRows = [...tableRows, newRow];
            setTableRows(newRows);
            onValueChange(element.id, newRows);
        };

        const handleDeleteRow = (rowIndex: number) => {
            const newRows = tableRows.filter((_, i) => i !== rowIndex);
            setTableRows(newRows);
            onValueChange(element.id, newRows);
        };

        const handleCellChange = (rowIndex: number, colIndex: number, newValue: any) => {
            const newRows = tableRows.map(row => [...row]);
            newRows[rowIndex][colIndex] = newValue;
        
            // Create a context object with the most recent values for the current row
            const rowData = columns?.reduce((acc, col, index) => {
                acc[col.key] = newRows[rowIndex][index];
                return acc;
            }, {} as { [key: string]: any }) || {};
        
            // Recalculate formulas for the row
            columns?.forEach((col, cIndex) => {
                if (col.formula) {
                    try {
                        // Update rowData context with the latest calculated values for this iteration
                        const currentContext = columns.reduce((acc, c, i) => {
                            acc[c.key] = newRows[rowIndex][i];
                            return acc;
                        }, {} as { [key: string]: any });
                        const result = evaluate(col.formula, currentContext);
                        newRows[rowIndex][cIndex] = String(result);
                    } catch (e) {
                        console.warn(`Error evaluating formula for ${col.key}:`, e);
                        newRows[rowIndex][cIndex] = "#ERROR!";
                    }
                }
            });
        
            setTableRows(newRows);
            onValueChange(element.id, newRows);
        };

        const getColumnIndex = (col: TableColumn) => {
            return columns?.findIndex(c => c.id === col.id) ?? -1;
        }

        const renderCell = (row: any[], rowIndex: number, col: TableColumn) => {
            const colIndex = getColumnIndex(col);
            const cellValue = row[colIndex];
            const isFormulaColumn = !!col.formula;

            const cellId = `${element.id}.${col.key}`;

            const rowContext = useMemo(() => {
                return columns?.reduce((acc, c, index) => {
                    const id = `${element.id}.${c.key}`;
                    acc[id] = { value: row[index] };
                    return acc;
                }, { ...formState } as { [key: string]: any }) || {};
            }, [row, columns, formState, element.id]);


           const isCellVisible = useMemo(() => {
                const showRules = rules.filter(r => r.behavior.type === 'show' && r.behavior.targetElementId === cellId);
                const hideRules = rules.filter(r => r.behavior.type === 'hide' && r.behavior.targetElementId === cellId);
                
                let visible;

                if (showRules.length > 0) {
                    visible = showRules.some(r => evaluateRule(r, rowContext));
                } else {
                    visible = !col.hidden;
                }

                if (visible && hideRules.some(r => evaluateRule(r, rowContext))) {
                    visible = false;
                }
                
                return visible;
            }, [col.hidden, cellId, rowContext, rules]);
            
            const isCellDisabled = useMemo(() => {
                if (!rowContext) return false;
                
                const isExplicitlyDisabled = rules.some(r => 
                    r.behavior.type === 'disable' && 
                    r.behavior.targetElementId === cellId &&
                    evaluateRule(r, rowContext)
                );

                if (isExplicitlyDisabled) {
                    return true;
                }

                const enableRules = rules.filter(r => 
                    r.behavior.type === 'enable' && 
                    r.behavior.targetElementId === cellId
                );

                if (enableRules.length > 0) {
                    const isEnabled = enableRules.some(r => evaluateRule(r, rowContext));
                    return !isEnabled;
                }

                return false;
            }, [cellId, rowContext, rules]);


            if (!isCellVisible) {
                return <TableCell key={col.id} className="p-2"></TableCell>;
            }

            if (isFormulaColumn) {
                return <TableCell key={col.id} className="p-2">{cellValue || <span className="text-muted-foreground">...</span>}</TableCell>;
            }

            switch(col.cellType) {
                case 'select':
                    return (
                        <TableCell key={col.id} className="p-2">
                            <Select
                                value={cellValue}
                                onValueChange={(val) => handleCellChange(rowIndex, colIndex, val)}
                                disabled={isCellDisabled}
                            >
                                <SelectTrigger className="h-8">
                                    <SelectValue placeholder="Select..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {col.options?.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </TableCell>
                    );
                case 'checkbox':
                    return (
                        <TableCell key={col.id} className="p-2">
                            <Checkbox 
                                checked={!!cellValue}
                                onCheckedChange={(checked) => handleCellChange(rowIndex, colIndex, checked)}
                                disabled={isCellDisabled}
                            />
                        </TableCell>
                    );
                case 'radio':
                    return (
                         <TableCell key={col.id} className="p-2">
                            <RadioGroup
                                value={cellValue}
                                onValueChange={(val) => handleCellChange(rowIndex, colIndex, val)}
                                className="flex gap-2"
                                disabled={isCellDisabled}
                            >
                                {col.options?.map(opt => (
                                    <div key={opt} className="flex items-center space-x-1">
                                        <RadioGroupItem value={opt} id={`${element.id}-${rowIndex}-${col.id}-${opt}`} />
                                        <Label htmlFor={`${element.id}-${rowIndex}-${col.id}-${opt}`} className="text-xs">{opt}</Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        </TableCell>
                    );
                case 'text':
                default:
                    return (
                        <TableCell key={col.id} className="p-2">
                            <Input
                                value={cellValue}
                                onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                                className="h-8"
                                disabled={isCellDisabled}
                            />
                        </TableCell>
                    );
            }
        }

        content = (
            <div className={cn(isDisabled && 'pointer-events-none opacity-50')}>
                <div className="flex justify-between items-center mb-2">
                    {renderLabel()}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                                Columns <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {columns?.map(col => (
                                <DropdownMenuCheckboxItem
                                    key={col.id}
                                    className="capitalize"
                                    checked={columnVisibility[col.id]}
                                    onCheckedChange={(value) =>
                                        setColumnVisibility(prev => ({
                                            ...prev,
                                            [col.id]: !!value
                                        }))
                                    }
                                >
                                    {col.title}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <div className={cn("rounded-md border", appliedStyles.error && "border-destructive")}>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {visibleColumns.map((col) => (
                                    <TableHead key={col.id}>{col.title}</TableHead>
                                ))}
                                {(allowEdit || allowDelete) && <TableHead className="w-[80px]">Actions</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tableRows.map((row, rowIndex) => (
                                <TableRow key={rowIndex}>
                                    {visibleColumns.map((col) => (
                                        allowEdit ? renderCell(row, rowIndex, col) : <TableCell key={col.id} className="p-2">{row[getColumnIndex(col)] || <span className="text-muted-foreground">...</span>}</TableCell>
                                    ))}
                                    {(allowEdit || allowDelete) && (
                                        <TableCell className="p-2">
                                            <div className="flex gap-2">
                                                {allowDelete && (
                                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteRow(rowIndex)}>
                                                        <Trash className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
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
    default:
      content = <div>Unsupported element type</div>;
      break;
  }

  return <div className={cn(isParentHorizontal && 'flex-1')}>{content}</div>;
}




    