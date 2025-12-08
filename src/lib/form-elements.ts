import { FormElementInstance, ElementType } from "./types";
import { CaseSensitive, CheckSquare, List, Milestone, TextCursorInput, Pilcrow, CalendarDays, FileText, RadioTower, ChevronsUpDown, Layout, Grid, Table2, Eye, Upload } from "lucide-react";
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
    { type: 'List', icon: List, label: 'List' },
    { type: 'DatePicker', icon: CalendarDays, label: 'Date Picker' },
    { type: 'Display', icon: CaseSensitive, label: 'Display Text' },
    { type: 'RichText', icon: FileText, label: 'Rich Text' },
    { type: 'DataGrid', icon: Grid, label: 'Data Grid'},
    { type: 'Table', icon: Table2, label: 'Editable Table' },
    { type: 'Preview', icon: Eye, label: 'Preview Button' },
    { type: 'FileUpload', icon: Upload, label: 'File Upload' },
    { type: 'Separator', icon: Milestone, label: 'Separator' },
];

export const createNewElement = (type: ElementType, id?: string): FormElementInstance => {
    const newId = id || crypto.randomUUID();
    const key = `${type.toLowerCase()}_${Math.random().toString(36).substring(2, 7)}`;
    const baseElement = { id: newId, type, label: type, key, required: false };
    
    switch (type) {
        case "Separator":
            return { ...baseElement, label: "" };
        case "Input":
            return { ...baseElement, label: "Text Field", placeholder: "Enter text...", inputFormat: 'text', defaultValue: "" };
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
        case "List":
            return {
                ...baseElement,
                label: "List Field",
                listType: 'checkbox',
                dataSource: 'static',
                options: ["Option 1", "Option 2"],
                displaySelection: 'none',
            };
        case "Checkbox":
            return { ...baseElement, label: "Checkbox Field" };
        case "RadioGroup":
             return { ...baseElement, label: "Radio Group", options: ["Option 1", "Option 2"] };
        case "DatePicker":
            return { ...baseElement, label: "Date Picker" };
        case "Display":
            return { ...baseElement, label: "Display Text", dataSourceConfig: { sourceElementId: "", displayKey: "" }, exposeForValidation: false };
        case "RichText":
            return { ...baseElement, label: "Rich Text Editor", content: "", exposeForValidation: false };
        case "Container":
            return { ...baseElement, label: "Container", elements: [], direction: 'vertical', justify: 'start', align: 'stretch', exposeForValidation: false };
        case "DataGrid":
            return {
                ...baseElement,
                label: "Data Grid",
                dataGridColumns: [
                    { id: crypto.randomUUID(), key: 'name', label: 'Name', element: createNewElement('Input') },
                    { id: crypto.randomUUID(), key: 'email', label: 'Email', element: createNewElement('Input') },
                ],
            }
        case "Table":
            const inputColumnElement = createNewElement('Input');
            const selectColumnElement = createNewElement('Select');
            return {
                ...baseElement,
                label: "Editable Table",
                canAddRows: true,
                defaultRows: 1,
                enableSearch: false,
                paginationEnabled: false,
                pageSize: 5,
                tableColumns: [
                    { id: crypto.randomUUID(), key: 'col_1', label: 'Column 1', element: { ...inputColumnElement, label: 'Input in Table' } },
                    { id: crypto.randomUUID(), key: 'col_2', label: 'Column 2', element: { ...selectColumnElement, label: 'Select in Table' } },
                ]
            }
        case "Preview":
            return { ...baseElement, label: "Preview Data", previewSectionIds: [] };
        case "FileUpload":
             return {
                ...baseElement,
                label: 'File Upload',
                allowedFileTypes: ['image/jpeg', 'image/png', 'application/pdf'],
                maxFileSize: 5, // 5MB
                multiple: false,
             }
        default:
            throw new Error("Invalid element type");
    }
}
