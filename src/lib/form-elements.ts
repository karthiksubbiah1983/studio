import { FormElementInstance, ElementType } from "./types";
import { CaseSensitive, CheckSquare, Heading1, List, Pilcrow, Radio, SeparatorHorizontal, Type, CalendarDays } from "lucide-react";

export const FormElements: {
  type: ElementType;
  icon: React.ElementType;
  label: string;
}[] = [
    { type: 'Title', icon: Heading1, label: 'Title' },
    { type: 'Separator', icon: SeparatorHorizontal, label: 'Separator' },
    { type: 'Input', icon: CaseSensitive, label: 'Text Input' },
    { type: 'Textarea', icon: Pilcrow, label: 'Textarea' },
    { type: 'Select', icon: List, label: 'Select' },
    { type: 'Checkbox', icon: CheckSquare, label: 'Checkbox' },
    { type: 'RadioGroup', icon: Radio, label: 'Radio Group' },
    { type: 'DatePicker', icon: CalendarDays, label: 'Date Picker' },
];

export const createNewElement = (type: ElementType): FormElementInstance => {
    const id = crypto.randomUUID();
    const baseElement = { id, type, label: type, required: false };
    
    switch (type) {
        case "Title":
            return { ...baseElement, label: "Title" };
        case "Separator":
            return { ...baseElement, label: "" };
        case "Input":
            return { ...baseElement, label: "Text Field", placeholder: "Enter text..." };
        case "Textarea":
            return { ...baseElement, label: "Textarea Field", placeholder: "Enter more text..." };
        case "Select":
            return { ...baseElement, label: "Select Field", options: ["Option 1", "Option 2"] };
        case "Checkbox":
            return { ...baseElement, label: "Checkbox Field", helperText: "This is a helper text" };
        case "RadioGroup":
             return { ...baseElement, label: "Radio Group", options: ["Option 1", "Option 2"] };
        case "DatePicker":
            return { ...baseElement, label: "Date Picker" };
        default:
            throw new Error("Invalid element type");
    }
}
