
import { FormElementInstance, ElementType } from "./types";
import { faCheckSquare, faList, faParagraph, faTable, faFont, faCalendarDays, faDotCircle, faFileAlt, faLayerGroup, faTextHeight } from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

export const FormElements: {
  type: ElementType;
  icon: IconDefinition;
  label: string;
}[] = [
    { type: 'Container', icon: faLayerGroup, label: 'Container' },
    { type: 'Input', icon: faFont, label: 'Text Input' },
    { type: 'Textarea', icon: faParagraph, label: 'Textarea' },
    { type: 'Select', icon: faList, label: 'Select' },
    { type: 'Checkbox', icon: faCheckSquare, label: 'Checkbox' },
    { type: 'RadioGroup', icon: faDotCircle, label: 'Radio Group' },
    { type: 'DatePicker', icon: faCalendarDays, label: 'Date Picker' },
    { type: 'Display', icon: faTextHeight, label: 'Display Text' },
    { type: 'Table', icon: faTable, label: 'Table' },
    { type: 'RichText', icon: faFileAlt, label: 'Rich Text' },
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
            return { ...baseElement, label: "Checkbox Field" };
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
