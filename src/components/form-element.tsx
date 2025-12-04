

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
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { fetchFromApi } from "@/services/api";
import { Popup } from "@/components/ui/popup";
import { Button } from "@/components/ui/button";
import { icons, Info, Plus, Trash, ChevronDown, AlertCircle, Loader2, Link, Eye, Upload, X, File as FileIcon, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LexicalEditor } from "@/components/lexical/lexical-editor";
import { evaluate } from "@/lib/formula-parser";
import { cn, findFirstArray, getAllElements, getNestedValue } from "@/lib/utils";
import { useBuilder } from "@/hooks/use-builder";
import { evaluateRule } from "@/components/form-preview-helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { DataGrid } from "@/components/ui/data-grid";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FormPreviewPopup } from "./form-preview-popup";


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
  const [dynamicOptions, setDynamicOptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isPreviewPopupOpen, setIsPreviewPopupOpen] = useState(false);

  const isVisible = useMemo(() => {
    if (!formState || isTableCell) return true;

    const showRules = rules.filter(rule => rule.behaviors.some(b => b.type === 'show' && b.targetElementId === element.id));
    const hideRules = rules.filter(rule => rule.behaviors.some(b => b.type === 'hide' && b.targetElementId === element.id));
    
    let visible = true; 

    if (showRules.length > 0) {
      visible = showRules.some(r => evaluateRule(r, formState));
    }

    if (visible && hideRules.length > 0) {
      if (hideRules.some(r => evaluateRule(r, formState))) {
        visible = false;
      }
    }
    
    return visible;
  }, [element.id, formState, rules, isTableCell]);

  const { value, isReadOnly } = useMemo(() => {
    const context = isTableCell ? rowContext : formState;
    if (!context) return { value: initialValue, isReadOnly: false };

    let finalValue = initialValue;
    let readOnly = false;
    
    for (const rule of rules) {
        const isRuleMet = evaluateRule(rule, context);
        if (isRuleMet) {
            const applicableBehavior = rule.behaviors.find(b => b.type === 'set_value' && b.targetElementId === element.id);
            if (applicableBehavior && applicableBehavior.value !== undefined) {
                finalValue = applicableBehavior.value;
                readOnly = true; // Make field read-only when value is set by a rule
                break; // First matching rule wins for setting value
            }
        }
    }
    
    return { value: finalValue, isReadOnly: readOnly };
  }, [element.id, initialValue, rules, formState, rowContext, isTableCell]);
  
 const isDisabled = useMemo(() => {
    if (!formState || isTableCell) return false;

    const disableRules = rules.filter(rule => rule.behaviors.some(b => b.type === 'disable' && b.targetElementId === element.id));
    if (disableRules.some(r => evaluateRule(r, formState))) {
      return true;
    }

    const enableRules = rules.filter(rule => rule.behaviors.some(b => b.type === 'enable' && b.targetElementId === element.id));
    if (enableRules.length > 0) {
      return !enableRules.some(r => evaluateRule(r, formState));
    }

    return false;
  }, [element.id, formState, rules, isTableCell]);

  const appliedStyles = useMemo(() => {
    const style: React.CSSProperties = {};
    let error: string | null = null;
    const context = isTableCell ? rowContext : formState;
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
  }, [element.id, formState, rules, isTableCell, rowContext]);
  
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
          const dependentValue = formState[element.dependentFieldId]?.value;
          
          if (dependentValue) {
              const placeholder = finalApiUrl.match(/\{(.+?)\}/);
              if (placeholder) {
                  finalApiUrl = finalApiUrl.replace(placeholder[0], encodeURIComponent(dependentValue));
              }
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
  }, [element.apiUrl, element.dependencyType, element.subKey, element.dependentFieldId, element.type, element.dataSource, formState?.[element.dependentFieldId!]?.value]);


  const { type, label, required, placeholder, helperText, options, dataSourceConfig, popup, inputFormat, dependentFieldId, isLink, linkUrl, textStyle, color, content: richTextContent, key } = element;

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
    case "Separator":
      content = <Separator />;
      break;
    case "Display": {
      let finalDisplayValue;

      if (isReadOnly) { // Value from a rule takes highest priority
          finalDisplayValue = value;
      } else if (dataSourceConfig?.sourceElementId && formState) { // Then check for data source config
          const sourceElement = allElements.find(el => el.id === dataSourceConfig.sourceElementId);
          const sourceValue = formState[dataSourceConfig.sourceElementId];
          if (sourceElement && sourceValue) {
              if (sourceElement.type === 'Select' && sourceValue.fullObject && dataSourceConfig.displayKey) {
                  finalDisplayValue = getNestedValue(sourceValue.fullObject, dataSourceConfig.displayKey);
              } else {
                  finalDisplayValue = sourceValue.value;
              }
          }
      } else if (isTableCell && rowContext && key) { // Then check for table cell context
          finalDisplayValue = getNestedValue(rowContext, key);
      }
      
      // Fallback to the label if no other value is determined
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
            val = val.replace(/[^0-9]/g, '');
        } else if (inputFormat === 'alphanumeric') {
            val = val.replace(/[^a-zA-Z0-9]/g, '');
        }
        onValueChange(element.id, val);
      };
      content = (
        <div>
          {!isTableCell && renderLabel()}
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
          {!isTableCell && renderLabel()}
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

        const isDependentAndParentNotSelected = dependentFieldId && !formState?.[dependentFieldId]?.value;

      content = (
        <div>
          {!isTableCell && renderLabel()}
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
          {!isTableCell && renderLabel()}
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
             const staticRows = value as any[] || [];
             const numDefaultRows = element.defaultRows || 0;
             const initialData = staticRows.length > 0 ? staticRows : Array(numDefaultRows).fill({});
             setTableData(initialData);
             if(staticRows.length === 0 && numDefaultRows > 0) {
                onValueChange(element.id, initialData);
             }
          }
        }, [element.dataSource, element.apiUrl, element.defaultRows]);

        useEffect(() => {
            if (value) {
                setTableData(value);
            }
        }, [value]);
        
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
            // Reset to page 1 when search term changes
            setCurrentPage(1);
        }, [searchTerm]);

        const handleRowValueChange = (rowIndex: number, columnKey: string, cellValue: any) => {
            let newRows = [...tableData];
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
                <div className="rounded-md border">
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
                 {element.canAddRows && element.dataSource !== 'dynamic' && (
                    <Button variant="outline" size="sm" className="mt-2" onClick={handleAddRow}>
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


