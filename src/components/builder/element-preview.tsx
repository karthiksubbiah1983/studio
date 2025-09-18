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

export function ElementPreview({ element }: { element: FormElementInstance }) {
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
              {options?.map((option, index) => (
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
            {helperText && <p className="text-sm text-muted-foreground">{helperText}</p>}
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
          <Calendar mode="single" className="p-0"/>
          {helperText && <p className="text-sm text-muted-foreground mt-1">{helperText}</p>}
        </div>
      );
    default:
      return <div>Unsupported element type</div>;
  }
}
