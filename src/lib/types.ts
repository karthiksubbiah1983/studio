export type ElementType = "Title" | "Separator" | "Input" | "Textarea" | "Select" | "Checkbox" | "RadioGroup" | "DatePicker" | "Display" | "Table" | "RichText" | "Container";

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

export type TableColumnCellType = 'text' | 'select' | 'checkbox' | 'radio';

export type TableColumn = {
    id: string;
    title:string;
    key: string;
    visible: boolean;
    formula?: string;
    cellType?: TableColumnCellType;
    options?: string[];
};

export type FormElementInstance = {
    id: string;
    type: ElementType;
    key: string; // Unique key for JSON schema
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
    // For Container
    elements?: FormElementInstance[];
    direction?: 'horizontal' | 'vertical';
};

export type Section = {
    id: string;
    title: string;
    config: 'expanded' | 'normal'; // normal is collapsible
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
