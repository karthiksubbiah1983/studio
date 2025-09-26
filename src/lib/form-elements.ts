
import { FormElementInstance, ElementType } from "./types";
import { CaseSensitive, CheckSquare, Heading1, List, Pilcrow, Radio, SeparatorHorizontal, Type, CalendarDays, Table, FileText, Layout } from "lucide-react";

export const FormElements: {
  type: ElementType;
  icon: React.ElementType;
  label: string;
}[] = [
    { type: 'Container', icon: Layout, label: 'Container' },
    { type: 'Input', icon: CaseSensitive, label: 'Text Input' },
    { type: 'Textarea', icon: Pilcrow, label: 'Textarea' },
    { type: 'Select', icon: List, label: 'Select' },
    { type: 'Checkbox', icon: CheckSquare, label: 'Checkbox' },
    { type: 'RadioGroup', icon: Radio, label: 'Radio Group' },
    { type: 'DatePicker', icon: CalendarDays, label: 'Date Picker' },
    { type: 'Display', icon: Type, label: 'Display Text' },
    { type: 'Table', icon: Table, label: 'Table' },
    { type: 'RichText', icon: FileText, label: 'Rich Text' },
];

export const createNewElement = (type: ElementType): FormElementInstance => {
    const id = crypto.randomUUID();
    const key = `${type.toLowerCase()}_${Math.random().toString(36).substring(2, 7)}`;
    const baseElement = { id, type, label: type, key, required: false };
    
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
            return { 
                ...baseElement, 
                label: "Select Field", 
                options: ["Option 1", "Option 2"], 
                dataSource: 'static', 
                placeholder: "Select an option"
            };
        case "Checkbox":
            return { ...baseElement, label: "Checkbox Field", helperText: "This is a helper text" };
        case "RadioGroup":
             return { ...baseElement, label: "Radio Group", options: ["Option 1", "Option 2"] };
        case "DatePicker":
            return { ...baseElement, label: "Date Picker" };
        case "Display":
            return { ...baseElement, label: "Display Text", dataSourceConfig: { sourceElementId: "", displayKey: "" } };
        case "Table":
            return {
                ...baseElement,
                label: "Data Table",
                columns: [
                    { id: crypto.randomUUID(), title: "Column 1", key: "col1", visible: true, cellType: 'text' },
                    { id: crypto.randomUUID(), title: "Column 2", key: "col2", visible: true, cellType: 'text' },
                ],
                initialRows: 3,
                allowAdd: true,
                allowEdit: true,
                allowDelete: true,
            }
        case "RichText":
            return { ...baseElement, label: "Rich Text Editor", content: "" };
        case "Container":
            return { ...baseElement, label: "Container", elements: [], direction: 'vertical', justify: 'start', align: 'stretch' };
        default:
            throw new Error("Invalid element type");
    }
}
