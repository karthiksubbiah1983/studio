

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
import { Clock, Table, Table2, Link, icons, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";

export function ElementPreview({ element }: { element: FormElementInstance }) {
  const { type, label, required, placeholder, helperText, options, dataSource, dataSourceConfig, elements, direction, isLink, linkUrl, textStyle, color, content } = element;

  const renderLabel = () => (
    <div className="flex justify-between items-center mb-2">
      <Label className="text-[0.9rem]">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
    </div>
  );

  const renderStyledText = (text: string) => {
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
    return <Tag className={cn(classes[style], 'mt-1')} style={{ color }}>{text}</Tag>;
  }

  switch (type) {
    case "Separator":
        return <Separator />;
    case "Display": {
        const text = dataSourceConfig?.sourceElementId ? `(Value from ${dataSourceConfig?.displayKey || '...'})` : label;

        if (isLink) {
            return (
                 <div className="flex items-center gap-2 mt-1 text-primary cursor-pointer hover:underline">
                    <Link className="h-4 w-4" />
                    <span className="text-sm">{text}</span>
                </div>
            )
        }
        return renderStyledText(text);
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
                <div 
                    className="prose dark:prose-invert text-sm"
                    dangerouslySetInnerHTML={{ __html: content || "<p>Rich text content goes here...</p>" }}
                />
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
    case "Preview":
        return (
            <div>
                {renderLabel()}
                <Button variant="outline" className="w-full" disabled>
                    <Eye className="mr-2 h-4 w-4" />
                    {label}
                </Button>
            </div>
        )
    default:
      return <div>Unsupported element type</div>;
  }
}
