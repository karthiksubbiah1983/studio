"use client";

import { FormElementInstance } from "@/lib/types";
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

type Props = {
  element: FormElementInstance;
  value: any;
  onValueChange: (id: string, value: any) => void;
};

export function FormElementRenderer({ element, value, onValueChange }: Props) {
  const [dynamicOptions, setDynamicOptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (element.type === 'Select' && element.dataSource === 'dynamic' && element.apiUrl) {
      setIsLoading(true);
      fetchFromApi(element.apiUrl, element.dataKey)
        .then(data => setDynamicOptions(data || []))
        .finally(() => setIsLoading(false));
    }
  }, [element]);

  const { type, label, required, placeholder, helperText, options } = element;

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
    case "Input":
      return (
        <div>
          {renderLabel()}
          <Input 
            placeholder={placeholder}
            value={value || ""}
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
            value={value || ""}
            onChange={(e) => onValueChange(element.id, e.target.value)}
          />
          {helperText && (
            <p className="text-sm text-muted-foreground mt-1">{helperText}</p>
          )}
        </div>
      );
    case "Select":
      return (
        <div>
          {renderLabel()}
          <Select value={value} onValueChange={(val) => onValueChange(element.id, val)}>
            <SelectTrigger>
              <SelectValue placeholder={isLoading ? "Loading..." : placeholder} />
            </SelectTrigger>
            <SelectContent>
              {element.dataSource === 'dynamic' ? (
                dynamicOptions.map((option) => (
                  <SelectItem key={option[element.valueKey!]} value={String(option[element.valueKey!])}>
                    {option[element.labelKey!]}
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
                    checked={value}
                    onCheckedChange={(checked) => onValueChange(element.id, checked)}
                />
                <div className="grid gap-1.5 leading-none">
                    <Label htmlFor={element.id}>{label}</Label>
                    {helperText && <p className="text-sm text-muted-foreground">{helperText}</p>}
                </div>
            </div>
        );
    case "RadioGroup":
      return (
        <div>
          {renderLabel()}
          <RadioGroup value={value} onValueChange={(val) => onValueChange(element.id, val)}>
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
      return (
        <div>
          {renderLabel()}
          <Calendar 
            mode="single"
            selected={value}
            onSelect={(date) => onValueChange(element.id, date)}
            className="p-0 border rounded-md"
          />
          {helperText && (
            <p className="text-sm text-muted-foreground mt-1">{helperText}</p>
          )}
        </div>
      );
    default:
      return <div>Unsupported element type</div>;
  }
}
