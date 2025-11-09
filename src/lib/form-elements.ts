
import { FormElementInstance, ElementType } from "./types";
import { CaseSensitive, CheckSquare, List, Milestone, TextCursorInput, Pilcrow, CalendarDays, Heading1, FileText, RadioTower, ChevronsUpDown, Layout, Grid } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const FormElements: {
  type: ElementType;
  icon: LucideIcon;
  label: string;
}[] = [
    { type: 'Container', icon: Layout, label: 'Container' },
    { type: 'Input', icon: TextCursorInput, label: 'Text Input' },
    { type: 'Textarea', icon: Pilcrow, label: 'Textarea' },
    { type: 'Select', icon: ChevronsUpDown, label: 'Select' },
    { type: 'Checkbox', icon: CheckSquare, label: 'Checkbox' },
    { type: 'RadioGroup', icon: RadioTower, label: 'Radio Group' },
    { type: 'DatePicker', icon: CalendarDays, label: 'Date Picker' },
    { type: 'Display', icon: CaseSensitive, label: 'Display Text' },
    { type: 'RichText', icon: FileText, label: 'Rich Text' },
    { type: 'DataGrid', icon: Grid, label: 'Data Grid'},
    { type: 'Title', icon: Heading1, label: 'Title' },
    { type: 'Separator', icon: Milestone, label: 'Separator' },
];

export const createNewElement = (type: ElementType): FormElementInstance => {
    const id = crypto.randomUUID();
    const key = `${type.toLowerCase()}_${Math.random().toString(36).substring(2, 7)}`;
    const baseElement = { id, type, label: type, key, required: false, hidden: false };
    
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
            return { ...baseElement, label: "Checkbox Field" };
        case "RadioGroup":
             return { ...baseElement, label: "Radio Group", options: ["Option 1", "Option 2"] };
        case "DatePicker":
            return { ...baseElement, label: "Date Picker" };
        case "Display":
            return { ...baseElement, label: "Display Text", dataSourceConfig: { sourceElementId: "", displayKey: "" } };
        case "RichText":
            return { ...baseElement, label: "Rich Text Editor", content: "" };
        case "Container":
            return { ...baseElement, label: "Container", elements: [], direction: 'vertical', justify: 'start', align: 'stretch' };
        case "DataGrid":
            return {
                ...baseElement,
                label: "Data Grid",
                apiUrl: "https://jsonplaceholder.typicode.com/users",
                selectionMode: 'single',
                columns: [
                    { id: '1', key: 'name', label: 'Name', visible: true },
                    { id: '2', key: 'email', label: 'Email', visible: true },
                    { id: '3', key: 'phone', label: 'Phone', visible: false },
                ]
            }
        default:
            throw new Error("Invalid element type");
    }
}
