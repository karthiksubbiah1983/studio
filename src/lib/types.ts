

export type ElementType = "Separator" | "Input" | "Textarea" | "Select" | "Checkbox" | "RadioGroup" | "DatePicker" | "Display" | "RichText" | "Container" | "DataGrid" | "Table" | "Preview" | "FileUpload" | "List";

export type RuleConditionOperator = 
    | 'equals' 
    | 'not_equals' 
    | 'is_greater_than' 
    | 'is_less_than'
    | 'contains'
    | 'not_contains';

export type RuleBehaviorType = 'show' | 'hide' | 'enable' | 'disable' | 'change_color' | 'set_error' | 'set_value';

export type ConditionSourceType = 'field' | 'date' | 'status';
export type ConditionComparisonType = 'value' | 'field' | 'date' | 'status';

export type Condition = {
    id: string;
    sourceType: ConditionSourceType;
    sourceElementId?: string; // Used for sourceType 'field'
    sourceValue?: string; // Used for sourceType 'date'
    operator: RuleConditionOperator;
    comparisonType: ConditionComparisonType;
    value?: string; // Used for comparisonType 'value', 'date', or 'status'
    comparisonElementId?: string; // Used for comparisonType 'field'
    offsetDays?: number;
};

export type RuleBehavior = {
    id: string;
    type: RuleBehaviorType;
    targetElementId?: string;
    color?: string;
    targetProperty?: 'color' | 'backgroundColor';
    message?: string;
    value?: string;
}

export type Rule = {
    id: string;
    name: string;
    conditions: Condition[];
    logicType: 'and' | 'or';
    behaviors: RuleBehavior[];
}

export type TaskStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed' | 'Escalated' | 'Assigned' | 'Submitted';

export type WorkflowAction = 
    | { type: 'CREATE_TASK', payload: { taskType: string; } }
    | { type: 'SET_TASK_STATUS', payload: { status: TaskStatus; } }
    | { type: 'CONFIGURE_MAIL', payload: { mailFormat: string; } };

export type Workflow = {
    id: string;
    name: string;
    conditions: Condition[];
    logicType: 'and' | 'or';
    actions: (WorkflowAction & { id: string })[];
}

export type DisplayDataSourceConfig = {
    sourceElementId: string; // ID of the Select element
    displayKey: string;      // Key of the property to display from the selected object
    sourceType?: 'field' | 'currentUser' | 'currentDateTime';
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
    element: FormElementInstance;
};

export type TableColumn = {
    id: string;
    key: string;
    label: string;
    element: FormElementInstance;
    formula?: string;
}

export type ListItemElement = {
    id: string;
    element: FormElementInstance;
};

export type FormElementInstance = {
    id: string;
    type: ElementType;
    key: string; // Unique key for JSON schema
    label: string;
    required: boolean;
    description?: string; // Corresponds to JSON Schema description
    helperText?: string;
    exposeForValidation?: boolean; // New property
    // For Input
    inputFormat?: 'text' | 'number' | 'alphanumeric';
    formula?: string;
    defaultValue?: any;
    // For Select, RadioGroup
    dataSource?: 'static' | 'dynamic';
    options?: string[];
    // For dynamic data source (Select, List)
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
    dataGridColumns?: DataGridColumn[];
    // For Table
    columns?: DataGridColumn[];
    paginationEnabled?: boolean;
    pageSize?: number;
    // For Table
    tableColumns?: TableColumn[];
    canAddRows?: boolean;
    defaultRows?: number;
    enableSearch?: boolean;
    // For Preview
    previewSectionIds?: string[];
    // For FileUpload
    allowedFileTypes?: string[];
    maxFileSize?: number; // in MB
    multiple?: boolean;
    // For List
    listType?: 'checkbox' | 'radio' | 'display';
    displaySelection?: 'none' | 'selected' | 'unselected';
    listItemElements?: ListItemElement[];
    enableScoring?: boolean;
    scorePerItem?: number;
    passingScore?: number;
    placeholder?: string;
};

export type Section = {
    id: string;
    title: string;
    displayMode?: 'default' | 'accordion';
    popupOnly?: boolean;
    hidden?: boolean;
    elements: FormElementInstance[];
    exposeForValidation?: boolean; // New property
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
    taskId?: string; // Link to the task
    timestamp: string;
    data: Record<string, any>;
};

export type ClipboardItem = 
    | { type: 'section', content: Section }
    | { type: 'element', content: FormElementInstance };

export type Site = {
    id: string;
    name: string;
};

export type Task = {
    id: string;
    formId: string;
    versionId: string;
    siteId: string;
    status: 'Assigned' | 'Submitted';
    submissionId?: string;
    assignedAt: string;
    submittedAt?: string;
};
