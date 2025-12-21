

import { FormElementInstance, ElementType } from "./types";
import { CaseSensitive, CheckSquare, List, Milestone, TextCursorInput, Pilcrow, CalendarDays, FileText, RadioTower, ChevronsUpDown, Layout, Eye, Upload, ListFilter, Table } from "lucide-react";
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
    { type: 'Combobox', icon: ListFilter, label: 'Combobox' },
    { type: 'List', icon: List, label: 'List' },
    { type: 'Checkbox', icon: CheckSquare, label: 'Checkbox' },
    { type: 'RadioGroup', icon: RadioTower, label: 'Radio Group' },
    { type: 'DatePicker', icon: CalendarDays, label: 'Date Picker' },
    { type: 'Display', icon: CaseSensitive, label: 'Display Text' },
    { type: 'RichText', icon: FileText, label: 'Rich Text' },
    { type: 'EditableTable', icon: Table, label: 'Editable Table' },
    { type: 'Preview', icon: Eye, label: 'Preview Button' },
    { type: 'FileUpload', icon: Upload, label: 'File Upload' },
    { type: 'Separator', icon: Milestone, label: 'Separator' },
];

export const createNewElement = (type: ElementType, id?: string): FormElementInstance => {
    const newId = id || crypto.randomUUID();
    const key = `${type.toLowerCase()}_${Math.random().toString(36).substring(2, 7)}`;
    const baseElement = { id: newId, type, label: type, key, required: false, hidden: false, exposeForValidation: false, placeholder: '' };
    
    switch (type) {
        case "Separator":
            return { ...baseElement, label: "", key: '' };
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
                placeholder: "Select an option",
                apiUrl: null,
                valueKey: null,
                labelKey: null,
            };
        case "Combobox":
            return {
                ...baseElement,
                label: "Combobox Field",
                options: ["Option 1", "Option 2"],
                dataSource: 'static',
                placeholder: "Select or type...",
                apiUrl: null,
                valueKey: null,
                labelKey: null,
            }
        case "List":
            return {
                ...baseElement,
                label: "List Field",
                dataSource: 'static',
                staticData: [{ id: crypto.randomUUID(), label: "Option 1" }],
                valueKey: 'id', // Use 'id' for value in static data
                labelKey: 'label', // Use 'label' for display in static data
                listType: 'checkbox',
                displaySelection: 'none',
                hasSecondaryText: false,
                isSecondaryTextLink: false,
                enableScoring: false,
                scorePerItem: 1,
                passingScore: 1,
                apiUrl: null,
            };
        case "Checkbox":
            return { ...baseElement, label: "Checkbox Field", key: key, required: false };
        case "RadioGroup":
             return { ...baseElement, label: "Radio Group", options: ["Option 1", "Option 2"], direction: 'vertical' };
        case "DatePicker":
            return { ...baseElement, label: "Date Picker" };
        case "Display":
            return { ...baseElement, label: "Display Text", dataSourceConfig: { sourceElementId: "", displayKey: "", sourceType: 'field' }, exposeForValidation: false, textStyle: 'p', color: '#000000', isLink: false, linkUrl: null, linkUrlSourceElementId: null };
        case "RichText":
            return { ...baseElement, label: "Rich Text Editor", content: "", exposeForValidation: false, key: '' };
        case "Container":
            return { ...baseElement, label: "Container", elements: [], direction: 'vertical', justify: 'start', align: 'stretch', exposeForValidation: false, key: '' };
        case "EditableTable":
            return {
                ...baseElement,
                label: "Editable Table",
                columns: [
                    { id: crypto.randomUUID(), label: 'Column 1', element: createNewElement('Input') }
                ],
                defaultRows: 0,
                maxRows: undefined,
                enableSearch: false,
                key: 'editable_table_1'
            };
        case "Preview":
            return { ...baseElement, label: "Preview Data", previewSectionIds: [], key: '' };
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
