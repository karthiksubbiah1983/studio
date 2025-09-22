"use client";

import { FormElementInstance, TableColumn } from "@/lib/types";
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
import { useEffect, useState } from "react";
import { fetchFromApi } from "@/services/api";
import { Popup } from "../ui/popup";
import { Button } from "../ui/button";
import { icons, Info, Plus, Trash, ChevronDown } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { LexicalEditor } from "../lexical/lexical-editor";

type Props = {
  element: FormElementInstance;
  value: any;
  onValueChange: (id: string, value: any, fullObject?: any) => void;
  formState?: { [key: string]: any };
};

const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

export function FormElementRenderer({ element, value, onValueChange, formState }: Props) {
  const [dynamicOptions, setDynamicOptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  
  const [tableRows, setTableRows] = useState<any[][]>([]);
  const [editingCell, setEditingCell] = useState<{rowIndex: number, colIndex: number} | null>(null);

  const initialColumnVisibility = element.columns?.reduce((acc, col) => {
    acc[col.id] = col.visible;
    return acc;
  }, {} as Record<string, boolean>) || {};

  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(initialColumnVisibility);


  useEffect(() => {
    if (element.type === 'Select' && element.dataSource === 'dynamic' && element.apiUrl) {
      setIsLoading(true);
      fetchFromApi(element.apiUrl, element.dataKey)
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
        setColumnVisibility(element.columns?.reduce((acc, col) => {
            acc[col.id] = col.visible;
            return acc;
        }, {} as Record<string, boolean>) || {});
    }
  }, [element, value]);

  const { type, label, required, placeholder, helperText, options, dataSourceConfig, popup } = element;

  const LucideIcon = popup?.icon ? (icons as any)[popup.icon] : null;

  const renderLabelWithPopup = () => (
    <div className="flex items-center gap-2 mb-2">
       <Label className="text-base">
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
      <Label className="text-base">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
    </div>
  );

  switch (type) {
    case "Title":
      return <h2 className="text-2xl font-bold">{label}</h2>;
    case "Separator":
      return <Separator />;
    case "Display": {
      if (!dataSourceConfig || !formState) return null;
      const { sourceElementId, displayKey } = dataSourceConfig;
      const sourceObject = formState[sourceElementId]?.fullObject;
      const displayValue = sourceObject ? getNestedValue(sourceObject, displayKey) : `(Not selected)`;
      
      return (
        <div>
          <Label className="text-base">{label}</Label>
          <p className="text-muted-foreground text-sm mt-1">{displayValue}</p>
        </div>
      );
    }
    case "Input":
      return (
        <div>
          {renderLabel()}
          <Input 
            placeholder={placeholder}
            value={value?.value || ""}
            onChange={(e) => onValueChange(element.id, e.target.value)}
          />
          {helperText && (
            <p className="text-sm text-muted-foreground mt-1">{helperText}</p>
          )}
        </div>
      );
    case "Textarea":
      return (
        <div>
          {renderLabel()}
          <Textarea 
            placeholder={placeholder}
            value={value?.value || ""}
            onChange={(e) => onValueChange(element.id, e.target.value)}
          />
          {helperText && (
            <p className="text-sm text-muted-foreground mt-1">{helperText}</p>
          )}
        </div>
      );
    case "RichText":
      return (
        <div>
          {renderLabel()}
          <LexicalEditor
            initialValue={value?.value}
            onChange={(html) => onValueChange(element.id, html)}
          />
          {helperText && (
            <p className="text-sm text-muted-foreground mt-1">{helperText}</p>
          )}
        </div>
      );
    case "Select":
        const handleSelectChange = (val: string) => {
            const fullObject = dynamicOptions.find(opt => String(getNestedValue(opt, element.valueKey!)) === val);
            onValueChange(element.id, val, fullObject);
        }
      return (
        <div>
          {renderLabel()}
          <Select value={value?.value} onValueChange={handleSelectChange}>
            <SelectTrigger>
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
        </div>
      );
    case "Checkbox":
        return (
            <div className="flex items-center space-x-2">
                <Checkbox 
                    id={element.id}
                    checked={value?.value}
                    onCheckedChange={(checked) => onValueChange(element.id, checked)}
                />
                <div className="grid gap-1.5 leading-none">
                    {renderLabelWithPopup()}
                    {helperText && <p className="text-sm text-muted-foreground">{helperText}</p>}
                </div>
            </div>
        );
    case "RadioGroup":
      return (
        <div>
          {renderLabelWithPopup()}
          <RadioGroup value={value?.value} onValueChange={(val) => onValueChange(element.id, val)}>
            {options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem
                  value={option}
                  id={`${element.id}-${index}`}
                />
                <Label htmlFor={`${element.id}-${index}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
          {helperText && (
            <p className="text-sm text-muted-foreground mt-1">{helperText}</p>
          )}
        </div>
      );
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

      return (
        <div>
          {renderLabel()}
          <div className="flex gap-2">
            <Calendar 
              mode="single"
              selected={dateValue}
              onSelect={handleDateChange}
              className="p-0 border rounded-md"
            />
            <Input 
              type="time"
              value={timeValue}
              onChange={handleTimeChange}
              className="w-32"
            />
          </div>
          {helperText && (
            <p className="text-sm text-muted-foreground mt-1">{helperText}</p>
          )}
        </div>
      );
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

        const handleCellChange = (rowIndex: number, colIndex: number, newValue: string) => {
            const newRows = tableRows.map(row => [...row]); // Deep copy rows
            newRows[rowIndex][colIndex] = newValue;
            setTableRows(newRows);
            onValueChange(element.id, newRows);
        };

        const getColumnIndex = (col: TableColumn) => {
            return columns?.findIndex(c => c.id === col.id) ?? -1;
        }

        return (
            <div>
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
                <div className="rounded-md border">
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
                                    {visibleColumns.map((col) => {
                                        const colIndex = getColumnIndex(col);
                                        const isEditing = allowEdit && editingCell?.rowIndex === rowIndex && editingCell?.colIndex === colIndex;

                                        return (
                                            <TableCell key={col.id} onClick={() => allowEdit && setEditingCell({rowIndex, colIndex})}>
                                                {isEditing ? (
                                                    <Input
                                                        autoFocus
                                                        value={row[colIndex]}
                                                        onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                                                        onBlur={() => setEditingCell(null)}
                                                        onKeyDown={(e) => { if (e.key === 'Enter') setEditingCell(null) }}
                                                    />
                                                ) : (
                                                    row[colIndex] || <span className="text-muted-foreground">...</span>
                                                )}
                                            </TableCell>
                                        )
                                    })}
                                    {(allowEdit || allowDelete) && (
                                        <TableCell>
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
            </div>
        );
    default:
      return <div>Unsupported element type</div>;
  }
}
