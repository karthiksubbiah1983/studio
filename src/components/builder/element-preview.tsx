
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
import { Clock, Edit, CheckSquare, List, MousePointerSquareDashed, Layout } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { cn } from "@/lib/utils";

export function ElementPreview({ element }: { element: FormElementInstance }) {
  const { type, label, required, placeholder, helperText, options, dataSource, dataSourceConfig, columns, initialRows, elements, direction } = element;

  const renderLabel = () => (
    <div className="flex justify-between items-center mb-2">
      <Label className="text-base">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
    </div>
  );

  const CellTypeIcon = ({ type }: { type: string | undefined }) => {
    switch (type) {
        case 'select': return <List className="h-3.5 w-3.5 text-muted-foreground" />;
        case 'checkbox': return <CheckSquare className="h-3.5 w-3.5 text-muted-foreground" />;
        case 'radio': return <List className="h-3.5 w-3.5 text-muted-foreground" />; // No direct radio icon, using list as placeholder
        case 'text':
        default:
            return <Edit className="h-3.5 w-3.5 text-muted-foreground" />;
    }
  }

  switch (type) {
    case "Title":
        return <h2 className="text-2xl font-bold">{label}</h2>;
    case "Separator":
        return <Separator />;
    case "Display":
        return (
            <div>
                <Label className="text-base">{label}</Label>
                <p className="text-muted-foreground text-sm mt-1">
                    {placeholder || `(Value from ${dataSourceConfig?.displayKey || '...'})`}
                </p>
            </div>
        );
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
    case "Table":
        return (
            <div>
                {renderLabel()}
                <Table>
                    <TableHeader>
                        <TableRow>
                            {columns?.filter(c => c.visible).map(col => (
                                <TableHead key={col.id} className="flex items-center gap-2">
                                  <CellTypeIcon type={col.cellType} />
                                  {col.title}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Array.from({ length: initialRows || 1 }).map((_, rowIndex) => (
                            <TableRow key={rowIndex}>
                                {columns?.filter(c => c.visible).map(col => (
                                     <TableCell key={col.id} className="text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            {col.cellType === 'checkbox' && <Checkbox disabled />}
                                            <span>...</span>
                                        </div>
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
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
    default:
      return <div>Unsupported element type</div>;
  }
}
