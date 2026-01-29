

"use client";

import { FormElementInstance, Rule, Condition, Section, ListItemElement, Configuration, TableColumn, CustomOption, Dataset } from "@/lib/types";
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
import { icons, Info, Plus, Trash, ChevronDown, AlertCircle, Loader2, Link, Eye, Upload, X, File as FileIcon, Search, ChevronLeft, ChevronRight, CalendarDays, Edit, ChevronsUpDown, Check, FileClock, ListChecks } from "lucide-react";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { LexicalEditor } from "@/components/lexical/lexical-editor";
import { evaluate } from "@/lib/formula-parser";
import { cn, findFirstArray, getAllElements, getNestedValue, findElementRecursive, evaluateRule } from "@/lib/utils";
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
import { FormPreview } from "./form-preview";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";


type Props = {
  element: FormElementInstance;
  value: any;
  onValueChange: (id: string, value: any, fullObject?: any) => void;
  formState?: { [key: string]: any };
  isParentHorizontal?: boolean;
  isTableCell?: boolean;
  rowContext?: any;
  rules?: Rule[];
  configurations?: Configuration[];
  sections?: Section[];
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

function DataGridRenderer({ element, value, onValueChange, formState, rules, configurations, sections }: { 
    element: FormElementInstance, 
    value: any, 
    onValueChange: (id: string, value: any) => void, 
    formState?: { [key: string]: any },
    rules?: Rule[],
    configurations?: Configuration[],
    sections?: Section[],
}) {
    const { datasets } = useBuilder();
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const rows = Array.isArray(value) ? value : [];
    const stableOnValueChange = useCallback(onValueChange, []);
    
    useEffect(() => {
        let isMounted = true;
        
        const loadData = () => {
            if (element.dataSource === 'dynamic' && element.apiUrl) {
                setIsLoading(true);
                fetchFromApi(element.apiUrl)
                    .then(fetchedData => {
                        if (isMounted) {
                            const arrayData = findFirstArray(fetchedData) || [];
                            stableOnValueChange(element.id, arrayData);
                        }
                    })
                    .finally(() => {
                        if (isMounted) setIsLoading(false);
                    });
            } else if (element.dataSource === 'local' && element.localDatasetName && datasets) {
                const localDataset = datasets.find(ds => ds.name === element.localDatasetName);
                const data = localDataset?.data || [];
                stableOnValueChange(element.id, data);
            }
        };

        loadData();

        return () => {
            isMounted = false;
        };
    }, [element.apiUrl, element.dataSource, element.localDatasetName, datasets, element.id, stableOnValueChange]);


    const handleCellChange = (rowIndex: number, columnElementId: string, cellValue: any) => {
        const newData = [...rows];
        const rowToUpdate = { ...newData[rowIndex] };

        const column = element.dataGridColumns?.find(c => c.element.id === columnElementId);
        if (column && column.element.key) {
            rowToUpdate[column.element.key] = cellValue;
        }

        newData[rowIndex] = rowToUpdate;
        onValueChange(element.id, newData);
    };
    
    const filteredDataForPagination = useMemo(() => {
        if (element.enableSearch && searchTerm) {
            return rows.filter(row => {
                return element.dataGridColumns?.some(col => {
                    if (!col.element.key) return false;
                    const cellValue = String(getNestedValue(row, col.element.key) ?? '');
                    return cellValue.toLowerCase().includes(searchTerm.toLowerCase());
                });
            });
        }
        return rows;
    }, [rows, searchTerm, element.enableSearch, element.dataGridColumns]);

    const paginatedData = useMemo(() => {
        if (element.enablePagination) {
            const pageSize = element.pageSize || 10;
            const startIndex = (currentPage - 1) * pageSize;
            const endIndex = startIndex + pageSize;
            return filteredDataForPagination.slice(startIndex, endIndex);
        }
        return filteredDataForPagination;
    }, [filteredDataForPagination, currentPage, element.enablePagination, element.pageSize]);


    const totalPages = useMemo(() => {
        if (!element.enablePagination) return 1;
        const pageSize = element.pageSize || 10;
        return Math.ceil(filteredDataForPagination.length / pageSize);
    }, [filteredDataForPagination, element.enablePagination, element.pageSize]);


    const handlePrevPage = () => {
        setCurrentPage(p => Math.max(1, p - 1));
    };

    const handleNextPage = () => {
        setCurrentPage(p => Math.min(totalPages, p + 1));
    };


    if (!element.dataGridColumns || element.dataGridColumns.length === 0) {
        return <p className="text-sm text-muted-foreground">Data Grid: Please configure columns in the builder.</p>;
    }
    
    return (
        <div>
             <Label className="text-[0.9rem] font-medium">{element.label}</Label>
            {element.enableSearch && (
                 <div className="relative my-2">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search..."
                        className="pl-8 w-full"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1); // Reset to first page on search
                        }}
                    />
                </div>
            )}
             <div className="mt-2 rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {element.dataGridColumns.map(col => (
                                <TableHead key={col.id} style={{ width: col.width || 'auto' }}>{col.header}</TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                             <TableRow>
                                <TableCell colSpan={element.dataGridColumns.length} className="h-24 text-center">
                                    <div className="flex items-center justify-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin"/>Loading data...</div>
                                </TableCell>
                            </TableRow>
                        ) : paginatedData.length > 0 ? (
                            paginatedData.map((row, rowIndex) => {
                                const originalIndex = rows.findIndex(item => item === row);
                                return (
                                    <TableRow key={originalIndex}>
                                        {element.dataGridColumns!.map(col => {
                                            const cellValue = col.element.key ? getNestedValue(row, col.element.key) : undefined;
                                            return (
                                                <TableCell key={col.id}>
                                                    <FormElementRenderer
                                                        element={col.element}
                                                        value={cellValue}
                                                        onValueChange={(id, val) => {
                                                            handleCellChange(originalIndex, id, val);
                                                        }}
                                                        formState={formState}
                                                        rowContext={row}
                                                        isTableCell={true}
                                                        rules={rules}
                                                        configurations={configurations}
                                                        sections={sections}
                                                    />
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>
                                )
                            })
                         ) : (
                            <TableRow>
                                <TableCell colSpan={element.dataGridColumns.length} className="h-24 text-center">
                                    No data available.
                                </TableCell>
                            </TableRow>
                         )}
                    </TableBody>
                </Table>
            </div>
             {element.enablePagination && totalPages > 1 && (
                <div className="flex items-center justify-end space-x-2 py-4">
                    <span className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePrevPage}
                        disabled={currentPage === 1}
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                    >
                        Next
                    </Button>
                </div>
            )}
        </div>
    );
}

function DataListRenderer({ element, value, onValueChange }: { 
    element: FormElementInstance, 
    value: any, 
    onValueChange: (id: string, value: any, fullObject?: any) => void 
}) {
    const { datasets } = useBuilder();
    
    const isCheckbox = element.listType === 'checkbox';
    const isRadio = element.listType === 'radio';
    const isDisplayOnly = element.listType === 'display';

    const currentSelection = isCheckbox ? (Array.isArray(value) ? value : []) : (value || '');

    const listOptions = useMemo(() => {
        if (element.localDatasetName) {
            const dataset = datasets.find(ds => ds.name === element.localDatasetName);
            return dataset?.data || [];
        }
        return [];
    }, [element.localDatasetName, datasets]);
    
    const mainListOptions = useMemo(() => {
        if (!currentSelection) return listOptions;
        if (element.displaySelection === 'selected' && !isDisplayOnly) {
            return listOptions.filter(option => {
                const optValue = String(getNestedValue(option, element.valueKey!) || '');
                return isCheckbox ? !currentSelection.includes(optValue) : currentSelection !== optValue;
            });
        }
        return listOptions;
    }, [listOptions, currentSelection, isCheckbox, isDisplayOnly, element]);

    const displayedSelection = useMemo(() => {
        if (element.displaySelection === 'none' || !currentSelection || isDisplayOnly) {
            return [];
        }
        if (element.displaySelection === 'selected') {
             return listOptions.filter(option => {
                const itemValue = String(getNestedValue(option, element.valueKey!) || '');
                return isCheckbox ? currentSelection.includes(itemValue) : currentSelection === itemValue;
            });
        }
        return [];
    }, [listOptions, currentSelection, isCheckbox, isDisplayOnly, element]);

    const handleListChange = (itemValue: string) => {
        if (isDisplayOnly) return;
    
        const findFullObject = (val: string) => listOptions.find(opt => {
            const optValue = String(getNestedValue(opt, element.valueKey!) || '');
            return optValue === val;
        });
    
        let newSelection: string[] | string;
        if (isCheckbox) {
            const selection = (currentSelection || []) as string[];
            newSelection = selection.includes(itemValue)
                ? selection.filter((v: string) => v !== itemValue)
                : [...selection, itemValue];
            
            const fullObjects = newSelection.map(val => findFullObject(val)).filter(Boolean);
            onValueChange(element.id, newSelection, fullObjects);
    
        } else { // isRadio
            newSelection = value === itemValue ? '' : itemValue;
            const fullObject = newSelection ? findFullObject(newSelection) : null;
            onValueChange(element.id, newSelection, fullObject);
        }

        if (element.enableScoring) {
            const selectionCount = Array.isArray(newSelection) ? newSelection.length : (newSelection ? 1 : 0);
            const score = selectionCount * (element.scorePerItem || 0);
            onValueChange(`${element.id}::score`, score);
        }
    };
        
    const renderListItemContent = (option: any) => {
        const itemLabel = String(getNestedValue(option, element.labelKey!) || '');
        const secondaryText = element.hasSecondaryText ? String(getNestedValue(option, element.secondaryTextKey!) || '') : null;
        const linkUrlValue = (element.isSecondaryTextLink
            ? getNestedValue(option, element.linkUrlKey!)
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

    const handleRemoveSelection = (itemValue: string) => {
        if (isCheckbox) {
            const selection = currentSelection as string[];
            const newSelection = selection.filter((v: string) => v !== itemValue);
            onValueChange(element.id, newSelection);
        } else { // Radio button
            onValueChange(element.id, '');
        }
    };

    const listContent = (
        <div className="rounded-md border p-2 space-y-2">
            {mainListOptions.length > 0 ? (
                mainListOptions.map((option, index) => {
                    const itemValue = String(getNestedValue(option, element.valueKey!) || '');
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
                    No Items
                </div>
            )}
        </div>
    );
        
    return (
        <div>
            <Label className="text-[0.9rem] font-medium">{element.label}</Label>
            {isRadio ? (
                <RadioGroup id={element.id} value={String(value)} onValueChange={handleListChange}>
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
                             const itemValue = String(getNestedValue(option, element.valueKey!) || '');
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
}

export function FormElementRenderer({ element, value: initialValue, onValueChange, formState, isParentHorizontal, isTableCell, rowContext, rules: rulesProp, configurations: configsProp, sections: sectionsProp }: Props) {
  const builderContext = useBuilder();
  const { rules: builderRules, sections: builderSections, configurations: builderConfigurations } = builderContext;
  const { user } = useAuth();
  const [dynamicOptions, setDynamicOptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [infoPopupOpen, setInfoPopupOpen] = useState(false);
  const [isPreviewPopupOpen, setIsPreviewPopupOpen] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState<Date | null>(null);
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [comboboxInputValue, setComboboxInputValue] = useState(initialValue || '');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  
  const [localValue, setLocalValue] = useState(initialValue || "");
  
  const [isRulePopupOpen, setIsRulePopupOpen] = useState(false);
  const [activePopupElementId, setActivePopupElementId] = useState<string | null>(null);
  
  const [popupTriggerState, setPopupTriggerState] = useState<any>(null);
  const [showInline, setShowInline] = useState(false);

  const rules = rulesProp || builderRules;
  const sections = sectionsProp || builderSections;
  const configurations = configsProp || builderConfigurations;

  const allElements = useMemo(() => getAllElements(sections), [sections]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const value = useMemo(() => {
    let finalValue = initialValue;
    if (typeof finalValue === 'object' && finalValue !== null && 'value' in finalValue && Object.keys(finalValue).length === 1) {
        finalValue = finalValue.value;
    }
    return finalValue;
  }, [initialValue]);

  useEffect(() => {
    const context = isTableCell ? { ...formState, ...rowContext } : formState;
    if ((element.type === 'Input' || element.type === 'Display') && element.formula && context) {
      let calculatedValue;
      try {
        calculatedValue = evaluate(element.formula, context, allElements);
      } catch (e) {
        console.error("Formula evaluation error:", e);
        calculatedValue = "#ERROR!";
      }

      if (calculatedValue !== value) {
        onValueChange(element.id, calculatedValue);
      }
    }
  }, [formState, rowContext, isTableCell, element.formula, element.id, allElements, value, onValueChange, element.type]);

    useEffect(() => {
        if (isTableCell || element.type !== 'Display' || element.formula) {
            return;
        }

        let finalDisplayValue;
        const { dataSourceConfig } = element;
        if (dataSourceConfig?.sourceType === 'currentUser' && user) {
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
            finalDisplayValue = element.label;
        }

        if (finalDisplayValue !== value) {
            onValueChange(element.id, finalDisplayValue);
        }
    }, [element.type, element.id, element.label, element.formula, element.dataSourceConfig, user, currentDateTime, formState, value, onValueChange, allElements, isTableCell]);


  useEffect(() => {
    setLocalValue(value || "");
    setComboboxInputValue(value || "");
  }, [value]);
  
  const isVisible = useMemo(() => {
    // For elements inside a table, visibility is handled by the EditableTable component itself.
    if (isTableCell) return true;

    const contextToCheck = formState || {};
    const hideRuleMet = rules.some(rule =>
        rule?.behaviors?.some(b => b.type === 'hide' && b.targetElementId === element.id) &&
        evaluateRule(rule, contextToCheck, configurations, allElements)
    );
    if (hideRuleMet) return false;
    
    const showRules = rules.filter(rule => rule?.behaviors?.some(b => b.type === 'show' && b.targetElementId === element.id));
    if (showRules.length > 0) {
        return showRules.some(r => evaluateRule(r, contextToCheck, configurations, allElements));
    }

    return !element.hidden;
  }, [element.id, element.hidden, formState, isTableCell, rules, configurations, allElements]);


  const isDisabled = useMemo(() => {
    const contextToCheck = isTableCell && rowContext ? { ...formState, ...rowContext } : formState;
    if (!contextToCheck || !rules) return false;

    const disableRules = rules.filter(rule => rule?.behaviors?.some(b => b.type === 'disable' && b.targetElementId === element.id));
    if (disableRules.some(r => evaluateRule(r, contextToCheck, configurations, sections))) {
      return true;
    }

    const enableRules = rules.filter(rule => rule?.behaviors?.some(b => b.type === 'enable' && b.targetElementId === element.id));
    if (enableRules.length > 0) {
      return !enableRules.some(r => evaluateRule(r, contextToCheck, configurations, sections));
    }

    return false;
  }, [element.id, formState, rowContext, isTableCell, rules, configurations, sections]);

  const isReadOnly = useMemo(() => {
    const contextToCheck = isTableCell && rowContext ? { ...formState, ...rowContext } : formState;
    if (element.readOnly) return true;
    if ((element.type === 'Input' || element.type === 'Display') && element.formula && contextToCheck) return true;
    if (rules.some(rule => rule.behaviors.some(b => b.type === 'set_value' && b.targetElementId === element.id && evaluateRule(rule, contextToCheck, configurations, sections)))) {
        return true;
    }
    return false;
  }, [element, formState, rowContext, isTableCell, rules, configurations, sections]);
  
  const appliedStyles = useMemo(() => {
    const contextToCheck = isTableCell && rowContext ? { ...formState, ...rowContext } : formState;
    const style: React.CSSProperties = {};
    let error: string | null = null;
    if (!contextToCheck || !rules) return { style, error };

    for (const rule of rules) {
        const isRuleMet = evaluateRule(rule, contextToCheck, configurations, sections, isTableCell ? rowContext : undefined);

        if (isRuleMet) {
            for (const behavior of rule.behaviors) {
                if (behavior.targetElementId === element.id) {
                    if (behavior.type === 'change_color' && behavior.targetProperty && behavior.color) {
                        style[behavior.targetProperty as any] = behavior.color;
                    }
                }
            }
        }
    }
    return { style, error };
  }, [element.id, formState, rowContext, isTableCell, rules, configurations, sections]);

  const isCheckbox = useMemo(() => element.type === 'List' && element.listType === 'checkbox', [element.type, element.listType]);
  const isRadio = useMemo(() => element.type === 'List' && element.listType === 'radio', [element.type, element.listType]);
  const isDisplayOnly = useMemo(() => element.type === 'List' && element.listType === 'display', [element.type, element.listType]);

  const currentSelection = useMemo(() => {
    if (element.type !== 'List') return null;
    return isCheckbox ? (Array.isArray(value) ? value : []) : (value || '');
  }, [element.type, isCheckbox, value]);

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
    if (!isClient) return;

    const popupRule = rules.find(rule => 
        rule.behaviors.some(b => b.type === 'show_popup' && b.targetElementId)
    );
    
    if (popupRule) {
        const isTriggered = evaluateRule(popupRule, formState, configurations, sections);
        const popupBehavior = popupRule.behaviors.find(b => b.type === 'show_popup');

        if (isTriggered && popupBehavior?.targetElementId) {
            const relevantState = popupRule.conditions.reduce((acc, cond) => {
                if (cond.sourceElementId && formState?.[cond.sourceElementId]) {
                    acc[cond.sourceElementId] = formState[cond.sourceElementId].value;
                }
                return acc;
            }, {} as any);
            
            if (JSON.stringify(relevantState) !== JSON.stringify(popupTriggerState)) {
                setActivePopupElementId(popupBehavior.targetElementId);
                setIsRulePopupOpen(true);
                setPopupTriggerState(relevantState);
            }
        }
    }
  }, [isClient, formState, rules, sections, configurations, popupTriggerState]);


  useEffect(() => {
    setCurrentDateTime(new Date());
    const timer = setInterval(() => setCurrentDateTime(new Date()), 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);
  

  useEffect(() => {
    if (element.type !== 'Select' && element.type !== 'List' && element.type !== 'Combobox') {
        return;
    }

    const context = isTableCell ? { ...formState, ...rowContext } : formState;
    const parentId = element.dataSourceParentId;

    if (element.dataSource === 'dynamic' && element.apiUrl) {
        let finalApiUrl = element.apiUrl;

        if (parentId && finalApiUrl.includes('{') && context) {
            // In a table, the context is the row itself, keys are element IDs
            const parentValue = isTableCell ? context[parentId] : context[parentId]?.value;
            
            if (parentValue) {
                const placeholder = finalApiUrl.substring(finalApiUrl.indexOf('{') + 1, finalApiUrl.indexOf('}'));
                let valueToInterpolate = parentValue;

                // If parent is also a select, we might need to get from its fullObject
                if (!isTableCell) {
                    const parentState = context[parentId];
                    const parentFullObject = (parentState && typeof parentState === 'object' && 'fullObject' in parentState) ? parentState.fullObject : null;
                    if (parentFullObject) {
                        valueToInterpolate = getNestedValue(parentFullObject, placeholder) || parentValue;
                    }
                } else {
                    const parentFullObject = context[`${parentId}__fullObject`];
                    if(parentFullObject) {
                       valueToInterpolate = getNestedValue(parentFullObject, placeholder) || parentValue;
                    }
                }

                finalApiUrl = finalApiUrl.replace(`{${placeholder}}`, valueToInterpolate);
            } else {
                setDynamicOptions([]);
                return;
            }
        }

        if (finalApiUrl && !finalApiUrl.includes('{')) {
            setIsLoading(true);
            fetchFromApi(finalApiUrl)
                .then(data => {
                    const arrayData = findFirstArray(data);
                    setDynamicOptions(arrayData || []);
                })
                .finally(() => setIsLoading(false));
        } else {
            setDynamicOptions([]);
        }
    } else if (element.dataSource === 'fromParent' && parentId && context) {
        const parentState = context[parentId];
        if (parentState?.fullObject && element.dataSourceParentKey) {
            const subList = getNestedValue(parentState.fullObject, element.dataSourceParentKey);
            setDynamicOptions(Array.isArray(subList) ? subList : []);
        } else {
            setDynamicOptions([]);
        }
    }
}, [element.dataSource, element.apiUrl, element.dataSourceParentId, element.dataSourceParentKey, formState, rowContext, isTableCell]);


  const { type, label, required, placeholder, helperText, options, popup, inputFormat, isLink, linkUrl, linkUrlKey, textStyle, color, content: richTextContent, key, direction, leadText, leadTextKey, fixedLength, leadingChar, formatType, currency, decimalPlaces, labelDirection, dateValidation, dateValidationRange, width } = element;

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
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setInfoPopupOpen(true)}>
                    <Info className="h-4 w-4 text-muted-foreground" />
                </Button>
                <Popup
                    isOpen={infoPopupOpen}
                    onOpenChange={setInfoPopupOpen}
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
    case "Popup":
      const popupElement = allElements.find(el => el.id === activePopupElementId);
      if (!isRulePopupOpen || !popupElement || popupElement.type !== 'Popup') {
          return null;
      }
      return (
        <FormPreviewPopup
          isOpen={isRulePopupOpen}
          onOpenChange={setIsRulePopupOpen}
          element={popupElement}
          formState={formState || {}}
        />
      );
    case "Display": {
      const context = isTableCell ? { ...formState, ...rowContext } : formState;

      let finalDisplayValue = value;
      if ((isTableCell || isParentHorizontal) && !finalDisplayValue && finalDisplayValue !== "") {
          // empty
      } else if (finalDisplayValue === undefined || finalDisplayValue === null || finalDisplayValue === "") {
          finalDisplayValue = label;
      }
        
      let finalLeadText = leadText;
      if (leadTextKey && context) {
          const dynamicLeadText = getNestedValue(context, leadTextKey);
          if (dynamicLeadText !== undefined && dynamicLeadText !== null) {
              finalLeadText = String(dynamicLeadText);
          }
      }

      let finalUrl = "";
      if (isLink) {
        if (linkUrlKey && context) {
            const dynamicUrl = getNestedValue(context, linkUrlKey);
            if (dynamicUrl) {
                finalUrl = String(dynamicUrl);
            }
        }
        if (!finalUrl && linkUrl) {
            finalUrl = interpolateString(linkUrl, context || {});
        }
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
            }).format(numValue / 100);
          } else if (formatType === 'decimal') {
            formattedValue = new Intl.NumberFormat(undefined, {
              style: 'decimal',
              minimumFractionDigits: decimalPlaces ?? 2,
              maximumFractionDigits: decimalPlaces ?? 2,
            }).format(numValue);
          }
        } catch (e) {
            console.error("Error formatting value:", e);
        }
      }

      const mainTextContent = isLink ? (
        <a href={finalUrl || '#'} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary cursor-pointer hover:underline">
            <Link className="h-3 w-3" />
            <span>{formattedValue}</span>
        </a>
      ) : (
        <Tag className={cn(classes[style], 'px-1.5 py-1')} style={finalStyle}>{formattedValue}</Tag>
      );

      content = (
           <div className={cn(
              "flex items-center gap-2",
              direction === 'vertical' && 'flex-col items-start'
           )}>
              {finalLeadText && <span className="text-sm text-muted-foreground">{finalLeadText}</span>}
              {mainTextContent}
          </div>
      );
      break;
    }
    case "Container": {
        const { elements, direction, justify, align } = element;
        const containerStyle: React.CSSProperties = { ...appliedStyles.style };
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
                        rules={rules}
                        configurations={configurations}
                        sections={sections}
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
              value={isReadOnly ? (value || element.defaultValue || '') : localValue}
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
    case "Select": {
        const handleSelectChange = (val: string) => {
            if (isTableCell && element.optionsDataKey && rowContext) {
                onValueChange(element.id, val);
                return;
            }

            if (element.dataSource === 'dynamic' || (element.dataSource === 'fromParent' && dynamicOptions.length > 0)) {
                let fullObject: any;
                if (element.customOptions?.some(opt => opt.value === val)) {
                    fullObject = element.customOptions.find(opt => opt.value === val);
                } else {
                    fullObject = dynamicOptions.find(opt => String(getNestedValue(opt, element.valueKey!)) === val);
                }
                onValueChange(element.id, val, fullObject);
            } else {
                 onValueChange(element.id, val);
            }
        }
        
        const rowOptions = isTableCell && element.optionsDataKey && rowContext ? getNestedValue(rowContext, element.optionsDataKey) : null;
        const hasRowOptions = Array.isArray(rowOptions);
    
        let combinedOptions = [...dynamicOptions];
        if (element.dataSource === 'dynamic' && element.customOptions) {
            const customSelectOptions = element.customOptions.map(opt => ({ [element.labelKey!]: opt.label, [element.valueKey!]: opt.value }));
            if (element.customOptionsPosition === 'top') {
                combinedOptions = [...customSelectOptions, ...combinedOptions];
            } else {
                combinedOptions = [...combinedOptions, ...customSelectOptions];
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
                    {hasRowOptions ? (
                        rowOptions.map((option: string, index: number) => (
                            <SelectItem key={index} value={option}>
                                {option}
                            </SelectItem>
                        ))
                    ) : element.dataSource === 'dynamic' || element.dataSource === 'fromParent' ? (
                        combinedOptions.map((option, index) => (
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
    }
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
        
            const findFullObject = (val: string) => allListOptions.find(opt => {
                const optValue = String(element.dataSource === 'dynamic' ? getNestedValue(opt, element.valueKey!) : opt.id);
                return optValue === val;
            });
        
            let newSelection: string | string[];
            if (isCheckbox) {
                const selection = (currentSelection || []) as string[];
                newSelection = selection.includes(itemValue)
                    ? selection.filter((v: string) => v !== itemValue)
                    : [...selection, itemValue];
                
                const fullObjects = newSelection.map(val => findFullObject(val)).filter(Boolean);
                onValueChange(element.id, newSelection, fullObjects);
        
            } else { // isRadio
                newSelection = value === itemValue ? '' : itemValue;
                const fullObject = newSelection ? findFullObject(newSelection) : null;
                onValueChange(element.id, newSelection, fullObject);
            }

            if (element.enableScoring) {
                const selectionCount = Array.isArray(newSelection) ? newSelection.length : (newSelection ? 1 : 0);
                const score = selectionCount * (element.scorePerItem || 0);
                onValueChange(`${element.id}::score`, score);
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
                    <RadioGroup id={element.id} value={String(value)} onValueChange={handleListChange}>
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
    case "DataList":
        return <DataListRenderer element={element} value={value} onValueChange={onValueChange} />;
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
    case "RadioGroup": {
      let radioOptions: string[] = [];
      let useDynamicOptions = false;

      if (isTableCell && element.optionsDataKey && rowContext) {
          const dynamicRowOptions = getNestedValue(rowContext, element.optionsDataKey);
          if (Array.isArray(dynamicRowOptions)) {
              radioOptions = dynamicRowOptions.map(String);
              useDynamicOptions = true;
          }
      }
      
      if (!useDynamicOptions && Array.isArray(element.options)) {
          radioOptions = element.options;
      }
      
      const handleRadioChange = useCallback((val: string) => {
        onValueChange(element.id, val);
      }, [onValueChange, element.id]);
      
      content = (
        <div id={element.id}>
          {renderLabelWithPopup()}
          <RadioGroup 
            value={value !== undefined && value !== null ? String(value) : undefined}
            onValueChange={handleRadioChange}
            className={cn("mt-3", direction === 'horizontal' ? "flex flex-row gap-4" : "grid gap-2")}
            disabled={isDisabled}
          >
            {radioOptions?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem
                  value={String(option)}
                  id={`${element.id}-${index}`}
                />
                <Label htmlFor={`${element.id}-${index}`} style={appliedStyles.style}>{String(option)}</Label>
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
    }
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
    case "Preview": {
        const sectionsToPreview = sections.filter(s => element.previewSectionIds?.includes(s.id));
        
        const toggleDisplay = () => {
            if (element.displayMode === 'popup') {
                setIsPreviewPopupOpen(true);
            } else { // inline
                setShowInline(prev => !prev);
            }
        };
        
        content = (
             <div>
                {renderLabel()}
                <Button variant="outline" className="w-full" onClick={toggleDisplay}>
                    <Eye className="mr-2 h-4 w-4" />
                    {label}
                </Button>

                {element.displayMode === 'popup' ? (
                     <Dialog open={isPreviewPopupOpen} onOpenChange={setIsPreviewPopupOpen}>
                        <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0">
                            <DialogHeader className="p-4 border-b">
                                <DialogTitle>{label}</DialogTitle>
                            </DialogHeader>
                            <ScrollArea className="flex-1">
                               <div className="p-4">
                                <FormPreview sections={sectionsToPreview} rules={rules} configurations={configurations} showSubmitButton={false} />
                               </div>
                            </ScrollArea>
                        </DialogContent>
                    </Dialog>
                ) : (
                    showInline && (
                        <div className="mt-4 border rounded-lg p-4">
                             <FormPreview sections={sectionsToPreview} rules={rules} configurations={configurations} showSubmitButton={false} />
                        </div>
                    )
                )}
            </div>
        );
        break;
    }
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
        />;
    case "DataGrid":
        content = <DataGridRenderer 
            element={element} 
            value={value} 
            onValueChange={onValueChange} 
            formState={formState}
            rules={rules}
            configurations={configurations}
            sections={sections}
        />;
        break;
    case "TaskHistory":
        if (!element.dataGridColumns || element.dataGridColumns.length === 0) {
            return (
                <div>
                    {renderLabel()}
                    <div className="rounded-md border bg-background p-4 flex flex-col items-center justify-center gap-2 min-h-[150px] text-muted-foreground">
                        <FileClock className="h-12 w-12" />
                        <p className="text-sm">Task History: Please configure columns in the builder.</p>
                    </div>
                </div>
            );
        }
        return (
            <div>
                {renderLabel()}
                <div className="mt-2 rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {element.dataGridColumns.map(col => (
                                    <TableHead key={col.id} style={{ width: col.width || 'auto' }}>{col.header}</TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell colSpan={element.dataGridColumns.length} className="h-24 text-center">
                                    Historical data will be shown here.
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
            </div>
        );
    default:
      content = <div>Unsupported element type: {type}</div>;
      break;
  }

  const wrapperStyle = element.type === 'Container' && width ? { width } : {};

  return <div style={wrapperStyle}>{content}</div>;
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

    
