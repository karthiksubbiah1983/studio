

export type ElementType = "Separator" | "Input" | "Textarea" | "Select" | "Checkbox" | "RadioGroup" | "DatePicker" | "Display" | "RichText" | "Container" | "DataGrid" | "Table" | "Preview";

export type RuleConditionOperator = 
    | 'equals' 
    | 'not_equals' 
    | 'is_greater_than' 
    | 'is_less_than'
    | 'contains'
    | 'not_contains';

export type RuleBehaviorType = 'show' | 'hide' | 'enable' | 'disable' | 'change_color' | 'set_error';

export type Condition = {
    id: string;
    sourceElementId: string;
    operator: RuleConditionOperator;
    comparisonType: 'static_value' | 'another_field';
    value: string; // Used for static_value
    comparisonElementId?: string; // Used for another_field
};

export type RuleBehavior = {
    id: string;
    type: RuleBehaviorType;
    targetElementId?: string;
    color?: string;
    targetProperty?: 'color' | 'backgroundColor';
    message?: string;
}

export type Rule = {
    id: string;
    name: string;
    conditions: Condition[];
    logicType: 'and' | 'or';
    behaviors: RuleBehavior[];
}

export type TaskStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed';

export type WorkflowAction = 
    | { type: 'CREATE_TASK', payload: { taskType: string; } }
    | { type: 'SET_TASK_STATUS', payload: { status: TaskStatus; } };

export type Workflow = {
    id: string;
    name: string;
    conditions: Condition[];
    logicType: 'and' | 'or';
    action: WorkflowAction;
}

export type DisplayDataSourceConfig = {
    sourceElementId:string; // ID of the Select element
    displayKey: string;      // Key of the property to display from the selected object
};

export type PopupConfig = {
    enabled: boolean;
    title: string;
    description: string;
    icon: string;
    iconColor: string;
}

export type DataGridColumn = {
    id: string;
    key: string;
    label: string;
    visible?: boolean;
};

export type TableColumn = {
    id: string;
    key: string;
    label: string;
    element: FormElementInstance;
    formula?: string;
}

export type FormElementInstance = {
    id: string;
    type: ElementType;
    key: string; // Unique key for JSON schema
    label: string;
    required: boolean;
    description?: string; // Corresponds to JSON Schema description
    helperText?: string;
    // For Input
    inputFormat?: 'text' | 'number' | 'alphanumeric';
    // For Select, RadioGroup
    dataSource?: 'static' | 'dynamic';
    options?: string[];
    // For dynamic data source (Select, DataGrid)
    apiUrl?: string;
    valueKey?: string; // Key in each object for option value
    labelKey?: string; // Key in each object for option label
    dependentFieldId?: string; // For cascading dropdowns
    dependencyType?: 'api' | 'parent'; // 'api' calls new url, 'parent' uses sub-array from parent data
    subKey?: string; // Key for the sub-array when dependencyType is 'parent'
    // For Display
    dataSourceConfig?: DisplayDataSourceConfig;
    textStyle?: 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
    color?: string;
    isLink?: boolean;
    linkUrl?: string;
    // For Checkbox, RadioGroup
    popup?: PopupConfig;
    // For RichText
    content?: string;
    // For Container
    elements?: FormElementInstance[];
    direction?: 'horizontal' | 'vertical';
    justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
    align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
    // For DataGrid
    columns?: DataGridColumn[];
    paginationEnabled?: boolean;
    pageSize?: number;
    // For Table
    tableColumns?: TableColumn[];
    canAddRows?: boolean;
    defaultRows?: number;
    // For Preview
    previewSectionIds?: string[];
};

export type Section = {
    id: string;
    title: string;
    displayMode?: 'default' | 'accordion';
    popupOnly?: boolean;
    elements: FormElementInstance[];
};

export type FormVersion = {
  id: string;
  name: string;
  description: string;
  type: "draft" | "published";
  timestamp: string;
  sections: Section[];
  rules: Rule[];
  workflows: Workflow[];
};

export type SubCategory = {
    id:string;
    name: string;
};

export type Category = {
    id: string;
    name: string;
    subCategories: SubCategory[];
};

export type Form = {
    id: string;
    title: string;
    categoryId?: string;
    subCategoryId?: string;
    versions: FormVersion[];
}

export type Submission = {
    id: string;
    formId: string;
    timestamp: string;
    data: Record<string, any>;
};

export type ClipboardItem = 
    | { type: 'section', content: Section }
    | { type: 'element', content: FormElementInstance };
