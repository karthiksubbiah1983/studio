export type ElementType = "Title" | "Separator" | "Input" | "Textarea" | "Select" | "Checkbox" | "RadioGroup" | "DatePicker";

export type FormElementInstance = {
    id: string;
    type: ElementType;
    label: string;
    required: boolean;
    placeholder?: string;
    helperText?: string;
    options?: string[];
};

export type Section = {
    id: string;
    title: string;
    config: 'expanded' | 'normal'; // normal is collapsible
    elements: FormElementInstance[];
};
