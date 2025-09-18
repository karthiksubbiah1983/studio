export type ElementType = "Title" | "Separator" | "Input" | "Textarea" | "Select" | "Checkbox" | "RadioGroup" | "DatePicker";

export type FormElementInstance = {
    id: string;
    type: ElementType;
    label: string;
    required: boolean;
    placeholder?: string;
    helperText?: string;
    // For Select, RadioGroup
    dataSource?: 'static' | 'dynamic';
    options?: string[];
    // For dynamic data source
    apiUrl?: string;
    dataKey?: string; // Key in API response that holds the array
    valueKey?: string; // Key in each object for option value
    labelKey?: string; // Key in each object for option label
};

export type Section = {
    id: string;
    title: string;
    config: 'expanded' | 'normal'; // normal is collapsible
    elements: FormElementInstance[];
};
