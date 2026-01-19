

export type ElementType = "Separator" | "Input" | "Textarea" | "Select" | "Checkbox" | "RadioGroup" | "DatePicker" | "Display" | "RichText" | "Container" | "FileUpload" | "List" | "Combobox" | "EditableTable" | "PayrollTable" | "Popup" | "Preview" | "DataGrid" | "TaskHistory";

export type RuleConditionOperator = 
    | 'equals' 
    | 'not_equals' 
    | 'is_greater_than' 
    | 'is_less_than'
    | 'is_greater_than_or_equal_to'
    | 'is_less_than_or_equal_to'
    | 'contains'
    | 'not_contains';

export type RuleBehaviorType = 'show' | 'hide' | 'enable' | 'disable' | 'change_color' | 'set_value' | 'set_configuration' | 'show_popup';

export type ConditionSourceType = 'field' | 'date' | 'status' | 'config';
export type ConditionComparisonType = 'value' | 'field' | 'date' | 'status' | 'config';

export type Condition = {
    id: string;
    sourceType: ConditionSourceType;
    sourceElementId?: string; // Used for sourceType 'field'
    sourcePropertyKey?: string; // Optional key to access a property of a source object (e.g., from a Select)
    sourceValue?: string; // Used for sourceType 'date' or 'config'
    operator: RuleConditionOperator;
    comparisonType: ConditionComparisonType;
    value?: string; // Used for comparisonType 'value', 'date', or 'status'
    comparisonElementId?: string; // Used for comparisonType 'field'
    includeTime?: boolean;
    offsetDays?: number;
    offsetHours?: number;
    offsetMinutes?: number;
    offsetValue?: number;
};

export type RuleBehavior = {
    id: string;
    type: RuleBehaviorType;
    targetElementId?: string; // For most behaviors
    color?: string; // For change_color
    targetProperty?: 'color' | 'backgroundColor'; // For change_color
    value?: string; // For set_value and set_configuration
    targetConfigurationKey?: string; // For set_configuration
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

export type Configuration = {
  id: string;
  key: string;
  value: string;
};

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

export type ListItemElement = {
    id: string;
    element: FormElementInstance;
};

export type TableColumn = {
  id: string;
  label: string;
  element: FormElementInstance;
};

export type DataGridColumn = {
  id: string;
  header: string;
  element: FormElementInstance;
  width?: string;
  sourceColumnId?: string;
};

export type CustomOption = {
  id: string;
  label: string;
  value: string;
};

export type FormElementInstance = {
    id: string;
    type: ElementType;
    key: string; // Unique key for JSON schema
    label: string;
    labelKey?: string;
    required: boolean;
    hidden?: boolean;
    description?: string; // Corresponds to JSON Schema description
    helperText?: string;
    exposeForValidation?: boolean; // New property
    readOnly?: boolean;
    // For Input
    inputFormat?: 'text' | 'number' | 'alphanumeric';
    fixedLength?: number;
    leadingChar?: string;
    formula?: string;
    defaultValue?: any;
    // For Select, RadioGroup, Combobox
    dataSource?: 'static' | 'dynamic' | 'fromParent';
    options?: string[]; // Kept for simple static lists like RadioGroup
    staticData?: any[]; // For complex static lists (List, DataGrid)
    // For dynamic data source (Select, List, Combobox, DataGrid)
    apiUrl?: string | null;
    valueKey?: string | null; // Key in each object for option value
    labelKey?: string | null; // Key in each object for option label
    secondaryTextKey?: string | null;
    linkUrlKey?: string | null;
    dataSourceParentId?: string | null;
    dataSourceParentKey?: string | null;
    customOptions?: CustomOption[];
    customOptionsPosition?: 'top' | 'bottom';
    // For Display
    dataSourceConfig?: DisplayDataSourceConfig;
    textStyle?: 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
    color?: string;
    isLink?: boolean;
    linkUrl?: string | null;
    linkUrlSourceElementId?: string | null;
    leadText?: string;
    leadTextKey?: string | null;
    // For Checkbox, RadioGroup
    popup?: PopupConfig;
    // For RichText
    content?: string;
    // For Container, RadioGroup, Display, Popup
    direction?: 'horizontal' | 'vertical';
    // For Container, Popup
    elements?: FormElementInstance[];
    justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
    align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
    width?: string;
    // For FileUpload
    allowedFileTypes?: string[];
    maxFileSize?: number; // in MB
    multiple?: boolean;
    // For List
    listType?: 'checkbox' | 'radio' | 'display';
    displaySelection?: 'none' | 'selected' | 'unselected';
    hasSecondaryText?: boolean;
    isSecondaryTextLink?: boolean;
    enableScoring?: boolean | null;
    scorePerItem?: number | null;
    passingScore?: number | null;
    placeholder?: string;
    // For EditableTable / PayrollTable
    columns?: TableColumn[];
    defaultRows?: number;
    maxRows?: number;
    allowUserToAddRows?: boolean;
    // For DataGrid / TaskHistory
    dataGridColumns?: DataGridColumn[];
    enableSearch?: boolean;
    enablePagination?: boolean;
    pageSize?: number;
    // General Layout
    labelDirection?: 'horizontal' | 'vertical';
    // For DatePicker
    dateValidation?: 'all' | 'noFuture' | 'noPast' | 'dateRange';
    dateValidationRange?: { from: string | null; to: string | null; };
    // For Popup
    triggerRuleId?: string | null;
    confirmButtonText?: string;
    cancelButtonText?: string;
    // For Preview
    previewSectionIds?: string[];
    displayMode?: 'popup' | 'inline';
};

export type Section = {
    id: string;
    title: string;
    displayMode?: 'default' | 'accordion';
    hidden?: boolean;
    elements: FormElementInstance[];
    exposeForValidation?: boolean; // New property
    popupOnly?: boolean;
    confirmButtonText?: string;
    cancelButtonText?: string;
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
  configurations?: Configuration[];
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
