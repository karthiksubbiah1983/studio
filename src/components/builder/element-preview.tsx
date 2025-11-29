

"use client";

import { FormElementInstance } from "@/lib/types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";
import { Clock, Table, Table2, Link } from "lucide-react";
import { cn } from "@/lib/utils";

export function ElementPreview({ element }: { element: FormElementInstance }) {
  const { type, label, required, placeholder, helperText, options, dataSource, dataSourceConfig, elements, direction, isLink } = element;

  const renderLabel = () => (
    <div className="flex justify-between items-center mb-2">
      <Label className="text-[0.9rem]">
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
        const text = placeholder || `(Value from ${dataSourceConfig?.displayKey || '...'})`;
        if (isLink) {
            return (
                 <div>
                    <Label className="text-[0.9rem]">{label}</Label>
                    <div className="flex items-center gap-2 mt-1 text-primary cursor-pointer hover:underline">
                        <Link className="h-4 w-4" />
                        <span className="text-sm">{text}</span>
                    </div>
                </div>
            )
        }
        return (
            <div>
                <Label className="text-[0.9rem]">{label}</Label>
                <p className="text-muted-foreground text-sm mt-1">
                    {text}
                </p>
            </div>
        );
    }
    case "Input":
      return (
        <div>
          {renderLabel()}
          <Input readOnly placeholder={placeholder} />
          {helperText && <p className="text-sm text-muted-foreground mt-1">{helperText}</p>}
        </div>
      );
    case "Textarea":
      return (
        <div>
          {renderLabel()}
          <Textarea readOnly placeholder={placeholder} />
          {helperText && <p className="text-sm text-muted-foreground mt-1">{helperText}</p>}
        </div>
      );
    case "Select":
      return (
        <div>
          {renderLabel()}
          <Select>
            <SelectTrigger>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {dataSource === 'dynamic' && <SelectItem value="dynamic">Data from API</SelectItem>}
              {dataSource !== 'dynamic' && options?.map((option, index) => (
                <SelectItem key={index} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {helperText && <p className="text-sm text-muted-foreground mt-1">{helperText}</p>}
        </div>
      );
    case "Checkbox":
      return (
        <div className="flex items-center space-x-2">
          <Checkbox id={element.id} />
          <div className="grid gap-1.5 leading-none">
            <Label htmlFor={element.id}>{label}</Label>
          </div>
        </div>
      );
    case "RadioGroup":
        return (
            <div>
                {renderLabel()}
                <RadioGroup>
                    {options?.map((option, index) => (
                        <div key={index} className="flex items-center space-x-2">
                            <RadioGroupItem value={option} id={`${element.id}-${index}`} />
                            <Label htmlFor={`${element.id}-${index}`}>{option}</Label>
                        </div>
                    ))}
                </RadioGroup>
                {helperText && <p className="text-sm text-muted-foreground mt-1">{helperText}</p>}
            </div>
        )
    case "DatePicker":
      return (
        <div>
          {renderLabel()}
          <div className="flex gap-2">
            <Calendar mode="single" className="p-0 rounded-md border w-auto"/>
            <div className="flex items-center justify-center border rounded-md w-32">
                <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
          {helperText && <p className="text-sm text-muted-foreground mt-1">{helperText}</p>}
        </div>
      );
    case "RichText":
      return (
        <div>
            {renderLabel()}
            <div className="rounded-md border border-input bg-background min-h-[150px] p-4 text-sm">
                Rich text content here...
            </div>
             {helperText && <p className="text-sm text-muted-foreground mt-1">{helperText}</p>}
        </div>
      )
    case "Container":
      return null;
    case "DataGrid":
       return (
         <div>
          {renderLabel()}
          <div className="rounded-md border bg-background p-4 flex flex-col items-center justify-center gap-2 min-h-[150px]">
            <Table className="h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Data Grid</p>
            <p className="text-xs text-muted-foreground/70">Data will be fetched from API</p>
          </div>
        </div>
       );
    case "Table":
        return (
            <div>
                {renderLabel()}
                <div className="rounded-md border bg-background p-4 flex flex-col items-center justify-center gap-2 min-h-[150px]">
                    <Table2 className="h-12 w-12 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Editable Table</p>
                    <p className="text-xs text-muted-foreground/70">{element.tableColumns?.length || 0} columns configured</p>
                </div>
            </div>
        )
    default:
      return <div>Unsupported element type</div>;
  }
}
