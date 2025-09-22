export type ElementType = "Title" | "Separator" | "Input" | "Textarea" | "Select" | "Checkbox" | "RadioGroup" | "DatePicker" | "Display" | "Table" | "RichText";

export type ConditionalLogic = {
    enabled: boolean;
    triggerElementId: string; // ID of the trigger element (e.g., RadioGroup, Select, Checkbox)
    showWhenValue: string;    // Value of the option that triggers visibility
};

export type DisplayDataSourceConfig = {
    sourceElementId: string; // ID of the Select element
    displayKey: string;      // Key of the property to display from the selected object
};

export type PopupConfig = {
    enabled: boolean;
    title: string;
    description: string;
    icon: string;
    iconColor: string;
}

export type TableColumn = {
    id: string;
    title: string;
    visible: boolean;
};

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
    // For dynamic data source (Select)
    apiUrl?: string;
    dataKey?: string; // Key in API response that holds the array
    valueKey?: string; // Key in each object for option value
    labelKey?: string; // Key in each object for option label
    // For Display
    dataSourceConfig?: DisplayDataSourceConfig;
    // For Checkbox, RadioGroup
    popup?: PopupConfig;
    // Conditional Visibility
    conditionalLogic?: ConditionalLogic;
    // For Table
    columns?: TableColumn[];
    initialRows?: number;
    allowAdd?: boolean;
    allowEdit?: boolean;
    allowDelete?: boolean;
    // For RichText
    content?: string;
};

export type Section = {
    id: string;
    title: string;
    config: 'expanded' | 'normal'; // normal is collapsible
    columns: 1 | 2 | 3;
    elements: FormElementInstance[];
    // Conditional Visibility
    conditionalLogic?: ConditionalLogic;
};

export type FormVersion = {
  id: string;
  name: string;
  description: string;
  type: "draft" | "published";
  timestamp: string;
  sections: Section[];
};
