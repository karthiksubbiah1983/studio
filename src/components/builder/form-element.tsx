

"use client";

import { FormElementInstance, TableColumn, Rule, Condition } from "@/lib/types";
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
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { LexicalEditor } from "../lexical/lexical-editor";
import { evaluate } from "@/lib/formula-parser";
import { cn } from "@/lib/utils";
import { useBuilder } from "@/hooks/use-builder";
import { findElementRecursive, getAllElements } from "@/lib/utils";
import { evaluateRule } from "../form-preview-helpers";

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
  const { sections } = useBuilder();
  const [dynamicOptions, setDynamicOptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});

  const appliedStyles = useMemo(() => {
    const style: React.CSSProperties = {};
    let error: string | null = null;
    if (!formState) return { style, error };

    const allRules = getAllElements(sections).flatMap(el => el.rules || []);
    
    for (const rule of allRules) {
        // Find the rule that targets the current element
        if (rule.behavior.targetElementId === element.id) {
            const isRuleMet = evaluateRule(rule, formState);

            if (isRuleMet) {
                switch(rule.behavior.type) {
                    case 'change_color':
                        if (rule.behavior.targetProperty && rule.behavior.color) {
                            style[rule.behavior.targetProperty] = rule.behavior.color;
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
  }, [element.id, formState, sections]);


  useEffect(() => {
    if (element.type === 'Select' && element.dataSource === 'dynamic' && element.apiUrl) {
      setIsLoading(true);
      fetchFromApi(element.apiUrl)
        .then(data => setDynamicOptions(data || []))
        .finally(() => setIsLoading(false));
    }
  }, [element, value, onValueChange]);

  const { type, label, required, placeholder, helperText, options, dataSourceConfig, popup } = element;

  const LucideIcon = popup?.icon ? (icons as any)[popup.icon] : null;

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
          <Select value={value?.value} onValueChange={handleSelectChange}>
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
          <RadioGroup value={value?.value} onValueChange={(val) => onValueChange(element.id, val)} className="mt-3">
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
        <div>
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
    default:
      content = <div>Unsupported element type</div>;
      break;
  }

  return <div className={cn(isParentHorizontal && 'flex-1')}>{content}</div>;
}
