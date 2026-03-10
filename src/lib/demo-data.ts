
import { Form, Category, Site, ChecklistRepository, TaskType, TaskTypeConfiguration, FormElementInstance } from './types';
import { createNewElement } from './form-elements';

export const relationalDataDemoTemplate: Form = {
  id: 'demo-relational-data',
  title: 'Relational Data Example',
  categoryId: 'demo-templates',
  versions: [
    {
      id: crypto.randomUUID(),
      name: 'Initial Version',
      description: 'A template demonstrating how to use dataset relationships to link data.',
      type: 'published',
      timestamp: new Date().toISOString(),
      sections: [
        {
          id: 's1-relational',
          title: 'Select a Body Part',
          displayMode: 'default',
          elements: [
            {
              id: 'datalist_body_parts',
              type: 'DataList',
              key: 'selected_body_part_inspection',
              label: 'Body Parts for Inspection',
              required: false,
              dataSource: 'local',
              localDatasetName: 'ds_body_parts',
              valueKey: 'id',
              labelKey: 'name',
              listType: 'radio',
            } as FormElementInstance,
          ],
        },
      ],
      rules: [],
      workflows: [],
      configurations: [],
      localDatasets: [
        {
          id: 'ds1',
          name: 'ds_body_parts',
          columns: [
            { id: 'c1', header: 'ID', key: 'id', type: 'text' },
            { id: 'c2', header: 'Name', key: 'name', type: 'text' },
            { id: 'c3', header: 'Priority ID', key: 'priority_id', type: 'text', linkedDatasetId: 'ds2', linkedFieldKey: 'id' },
          ],
          data: [
            { id: 'bp1', name: 'Head', priority_id: 'p1' },
            { id: 'bp2', name: 'Arm', priority_id: 'p2' },
            { id: 'bp3', name: 'Leg', priority_id: 'p3' },
            { id: 'bp4', name: 'Stomach', priority_id: 'p2' },
          ],
        },
        {
          id: 'ds2',
          name: 'ds_priorities',
          columns: [
            { id: 'p_c1', header: 'ID', key: 'id', type: 'text' },
            { id: 'p_c2', header: 'Level', key: 'level', type: 'text' },
            { id: 'p_c3', header: 'Location ID', key: 'location_id', type: 'text', linkedDatasetId: 'ds3', linkedFieldKey: 'id' },
          ],
          data: [
            { id: 'p1', level: 'High', location_id: 'loc1' },
            { id: 'p2', level: 'Medium', location_id: 'loc2' },
            { id: 'p3', level: 'Low', location_id: 'loc2' },
          ],
        },
        {
          id: 'ds3',
          name: 'ds_locations',
          columns: [
            { id: 'l_c1', header: 'ID', key: 'id', type: 'text' },
            { id: 'l_c2', header: 'Name', key: 'name', type: 'text' },
          ],
          data: [
            { id: 'loc1', name: 'Hotel' },
            { id: 'loc2', name: 'Restaurant' },
          ],
        },
      ],
    },
  ],
};


export const editableTableCascadingDemo: Form = {
    id: "demo-editable-table-cascading",
    title: "Editable Table with Cascading Dropdowns",
    categoryId: "demo-templates",
    versions: [
        {
            id: crypto.randomUUID(),
            name: "Initial Version",
            description: "A template demonstrating cascading dropdowns within an editable table.",
            type: "published",
            timestamp: new Date().toISOString(),
            sections: [
                {
                    id: "s1-editable-cascade",
                    title: "Scenario 1: Making a New API Call",
                    displayMode: "default",
                    elements: [
                         {
                            id: "location_table",
                            type: "EditableTable",
                            key: "locations",
                            label: "Location Selector",
                            required: false,
                            columns: [
                                {
                                    id: "col_region",
                                    label: "Region",
                                    element: {
                                        ...createNewElement("Select"),
                                        id: "col_region_el",
                                        key: "region",
                                        label: "Region",
                                        dataSource: 'dynamic',
                                        apiUrl: '/mock-data/regions.json',
                                        valueKey: 'id',
                                        labelKey: 'name',
                                        placeholder: 'Select a region...'
                                    }
                                },
                                {
                                    id: "col_country",
                                    label: "Country",
                                    element: {
                                        ...createNewElement("Select"),
                                        id: "col_country_el",
                                        key: "country",
                                        label: "Country",
                                        dataSource: 'dynamic',
                                        apiUrl: '/mock-data/countries/{id}.json',
                                        dataSourceParentId: 'col_region_el', // Reference the element in the other column
                                        valueKey: 'id',
                                        labelKey: 'name',
                                        placeholder: 'Select a country...'
                                    }
                                },
                            ]
                        }
                    ],
                },
                {
                    id: "s2-editable-cascade",
                    title: "Scenario 2: Filtering from a Single API Call",
                    displayMode: "default",
                    elements: [
                        {
                            id: "product_table",
                            type: "EditableTable",
                            key: "products",
                            label: "Product Selector",
                            required: false,
                            columns: [
                                {
                                    id: "col_prod_family",
                                    label: "Product Family",
                                    element: {
                                        ...createNewElement("Select"),
                                        id: "col_prod_family_el",
                                        key: "productFamily",
                                        label: "Product Family",
                                        dataSource: 'dynamic',
                                        apiUrl: '/mock-data/product-families.json',
                                        valueKey: 'familyId',
                                        labelKey: 'familyName',
                                        placeholder: "Select a family..."
                                    }
                                },
                                {
                                    id: "col_prod_name",
                                    label: "Product",
                                    element: {
                                        ...createNewElement("Select"),
                                        id: "col_prod_name_el",
                                        key: "product",
                                        label: "Product",
                                        dataSource: 'fromParent',
                                        dataSourceParentId: 'col_prod_family_el',
                                        dataSourceParentKey: 'products',
                                        valueKey: 'productId',
                                        labelKey: 'productName',
                                        placeholder: 'Select a product...'
                                    }
                                }
                            ]
                        }
                    ]
                }
            ],
            rules: [],
            workflows: [],
            configurations: [],
            localDatasets: [],
        }
    ]
};

export const cascadingDemoTemplate: Form = {
    id: "demo-cascading-dropdowns",
    title: "Standalone Cascading Dropdowns",
    categoryId: "demo-templates",
    versions: [
        {
            id: crypto.randomUUID(),
            name: "Initial Version",
            description: "A template demonstrating cascading dropdowns outside of a table.",
            type: "published",
            timestamp: new Date().toISOString(),
            sections: [
                {
                    id: "s1-cascade",
                    title: "Scenario 1: Filtering from a Single API Call",
                    displayMode: "default",
                    elements: [
                        {
                            id: "parent-product-family",
                            type: "Select",
                            key: "productFamily",
                            label: "Product Family",
                            required: true,
                            dataSource: 'dynamic',
                            apiUrl: '/mock-data/product-families.json',
                            valueKey: 'familyId',
                            labelKey: 'familyName',
                            placeholder: "Select a product family..."
                        },
                        {
                            id: "child-product",
                            type: "Select",
                            key: "product",
                            label: "Product",
                            required: true,
                            dataSource: 'fromParent',
                            dataSourceParentId: 'parent-product-family',
                            dataSourceParentKey: 'products',
                            valueKey: 'productId',
                            labelKey: 'productName',
                            placeholder: "Select a product..."
                        }
                    ],
                },
                {
                    id: "s2-cascade",
                    title: "Scenario 2: Making a New API Call",
                    displayMode: "default",
                    elements: [
                        {
                            id: "parent-region",
                            type: "Select",
                            key: "region",
                            label: "Region",
                            required: true,
                            dataSource: 'dynamic',
                            apiUrl: '/mock-data/regions.json',
                            valueKey: 'id',
                            labelKey: 'name',
                            placeholder: "Select a region..."
                        },
                        {
                            id: "child-country",
                            type: "Select",
                            key: "country",
                            label: "Country",
                            required: true,
                            dataSource: 'dynamic',
                            apiUrl: '/mock-data/countries/{id}.json',
                            dataSourceParentId: 'parent-region',
                            valueKey: 'id',
                            labelKey: 'name',
                            placeholder: "Select a country..."
                        }
                    ],
                },
            ],
            rules: [],
            workflows: [],
            configurations: [],
            localDatasets: [],
        }
    ]
};

export const demoTemplate: Form = {
    id: "demo-expense-report",
    title: "Advanced Expense Report",
    categoryId: "demo-templates",
    versions: [
        {
            id: crypto.randomUUID(),
            name: "Initial Version",
            description: "A template demonstrating the editable table features.",
            type: "published",
            timestamp: new Date().toISOString(),
            sections: [
                {
                    id: "s1",
                    title: "Report Header",
                    displayMode: "default",
                    elements: [
                        {
                            id: "enable_notes_checkbox",
                            type: "Checkbox",
                            key: "enable_notes",
                            label: "Enable All Notes",
                            required: false,
                        },
                        {
                            id: "urgent_review_display",
                            type: "Display",
                            key: "urgent_review_indicator",
                            label: "🔴 URGENT REVIEW REQUIRED",
                            required: false,
                            hidden: true, // Initially hidden
                        }
                    ],
                },
                {
                    id: "s2",
                    title: "Expenses",
                    displayMode: "default",
                    elements: [
                        {
                            id: "expense_table",
                            type: "EditableTable",
                            key: "expenses",
                            label: "Expense Items",
                            required: false,
                            columns: [
                                { id: "col_date", label: "Date", element: { ...createNewElement("DatePicker"), id: "col_date_el", key: "date", label: "Date" } },
                                { id: "col_category", label: "Category", element: { ...createNewElement("Select"), id: "col_category_el", key: "category", label: "Category", options: ["Travel", "Meal", "Software", "Other"] } },
                                { id: "col_description", label: "Description", element: { ...createNewElement("Input"), id: "col_desc_el", key: "description", label: "Description" } },
                                { id: "col_amount", label: "Amount", element: { ...createNewElement("Input"), id: "col_amount_el", key: "amount", label: "Amount", inputFormat: "number" } },
                                { id: "col_justification", label: "Justification", element: { ...createNewElement("Textarea"), id: "col_just_el", key: "justification", label: "Justification", hidden: true } },
                                { id: "col_notes", label: "Notes", element: { ...createNewElement("Textarea"), id: "col_notes_el", key: "notes", label: "Notes", hidden: true } },
                            ],
                        },
                    ],
                },
            ],
            rules: [
                // External to Internal Rule
                {
                    id: "rule_enable_notes",
                    name: "Toggle Notes Column",
                    conditions: [ { id: "c1", sourceType: "field", sourceElementId: "enable_notes_checkbox", operator: "equals", comparisonType: "value", value: "true" } ],
                    logicType: "and",
                    behaviors: [ { id: "b1", type: "show", targetElementId: "col_notes_el" } ]
                },
                 {
                    id: "rule_disable_notes",
                    name: "Toggle Notes Column Off",
                    conditions: [ { id: "c2", sourceType: "field", sourceElementId: "enable_notes_checkbox", operator: "not_equals", comparisonType: "value", value: "true" } ],
                    logicType: "and",
                    behaviors: [ { id: "b2", type: "hide", targetElementId: "col_notes_el" } ]
                },
                // Internal to Internal Rule
                {
                    id: "rule_show_justification",
                    name: "Show Justification for Other",
                    conditions: [ { id: "c3", sourceType: "field", sourceElementId: "col_category_el", operator: "equals", comparisonType: "value", value: "Other" } ],
                    logicType: "and",
                    behaviors: [ { id: "b3", type: "show", targetElementId: "col_just_el" } ]
                },
                 {
                    id: "rule_hide_justification",
                    name: "Hide Justification",
                    conditions: [ { id: "c4", sourceType: "field", sourceElementId: "col_category_el", operator: "not_equals", comparisonType: "value", value: "Other" } ],
                    logicType: "and",
                    behaviors: [ { id: "b4", type: "hide", targetElementId: "col_just_el" } ]
                },
                // Internal to External Rule
                {
                    id: "rule_set_urgent_review",
                    name: "Set Urgent Review Flag",
                    conditions: [ { id: "c5", sourceType: "field", sourceElementId: "col_amount_el", operator: "is_greater_than", comparisonType: "value", value: "100" } ],
                    logicType: "and",
                    behaviors: [ { id: "b5", type: "set_configuration", targetConfigurationKey: "requires_urgent_review", value: "true" } ]
                },
                 // Rule reacting to configuration change
                {
                    id: "rule_show_urgent_indicator",
                    name: "Show Urgent Indicator",
                    conditions: [ { id: "c6", sourceType: "config", sourceValue: "requires_urgent_review", operator: "equals", comparisonType: "value", value: "true" } ],
                    logicType: "and",
                    behaviors: [ { id: "b6", type: "show", targetElementId: "urgent_review_display" } ]
                },

            ],
            workflows: [],
            configurations: [
                { id: "config1", key: "approver_level", value: "manager" },
                { id: "config2", key: "requires_urgent_review", value: "false" }
            ],
            localDatasets: [],
        },
    ],
};

export const demoCategory: Category = {
    id: "demo-templates",
    name: "Demo Templates",
    subCategories: []
};

// Sample Data for Checklist
export const sampleChecklistRepository: ChecklistRepository = {
    categories: [
        {
            id: 'cat_building_safety',
            name: 'Building Safety',
            children: [
                {
                    id: 'cat_fire_safety',
                    name: 'Fire Safety',
                    children: [
                        { id: 'cat_fire_extinguishers', name: 'Fire Extinguishers', children: [] },
                        { id: 'cat_fire_alarms', name: 'Fire Alarms', children: [] },
                    ],
                },
                { id: 'cat_electrical_safety', name: 'Electrical Safety', children: [] },
            ],
        },
        {
            id: 'cat_operational_checks',
            name: 'Operational Checks',
            children: [
                { id: 'cat_machinery', name: 'Machinery', children: [] },
            ],
        },
         {
            id: 'cat_bedroom',
            name: 'Bedroom',
            children: [],
        },
        {
            id: 'cat_bathroom',
            name: 'Bathroom',
            children: [],
        }
    ],
    questions: [
        {
            id: 'q_extinguisher_present',
            label: 'Is the fire extinguisher present and accessible?',
            answerType: 'yes-no',
            answerOptions: [
                { id: 'yes', label: 'Yes' },
                { id: 'no', label: 'No', isCommentRequired: true, commentPlaceholder: 'Explain why it is not accessible.' },
            ],
            categoryId: 'cat_building_safety',
            subCategoryId: 'cat_fire_safety',
            subSubCategoryId: 'cat_fire_extinguishers',
        },
        {
            id: 'q_pressure_gauge',
            label: 'Is the pressure gauge in the green zone?',
            answerType: 'yes-no',
            answerOptions: [
                { id: 'yes', label: 'Yes' },
                { id: 'no', label: 'No', isCommentRequired: true, commentPlaceholder: 'Record the pressure reading and report it.' },
            ],
            categoryId: 'cat_building_safety',
            subCategoryId: 'cat_fire_safety',
            subSubCategoryId: 'cat_fire_extinguishers',
        },
        {
            id: 'q_alarm_panel_faults',
            label: 'Is the alarm panel showing any faults?',
            answerType: 'yes-no',
            answerOptions: [
                { id: 'yes', label: 'Yes', isCommentRequired: true, commentPlaceholder: 'Describe the fault codes shown on the panel.' },
                { id: 'no', label: 'No' },
            ],
            categoryId: 'cat_building_safety',
            subCategoryId: 'cat_fire_safety',
            subSubCategoryId: 'cat_fire_alarms',
        },
        {
            id: 'q_exits_clear',
            label: 'Are all emergency exits clear of obstructions?',
            answerType: 'yes-no',
            answerOptions: [
                { id: 'yes', label: 'Yes' },
                { id: 'no', label: 'No', isCommentRequired: true, commentPlaceholder: 'List which exits are blocked and why.' },
            ],
            categoryId: 'cat_building_safety',
        },
        {
            id: 'q_machine_guarding',
            label: 'Are all machines guarded properly?',
            answerType: 'single-select',
            answerOptions: [
                { id: 'fully_guarded', label: 'Fully Guarded' },
                { id: 'partially_guarded', label: 'Partially Guarded', isCommentRequired: true, commentPlaceholder: 'Specify which parts are unguarded.' },
                { id: 'not_guarded', label: 'Not Guarded', isCommentRequired: true, commentPlaceholder: 'Specify which machines are not guarded.' },
            ],
            categoryId: 'cat_operational_checks',
            subCategoryId: 'cat_machinery',
        },
        {
            id: 'q_bed_linens',
            label: 'Are bed linens clean and wrinkle-free?',
            answerType: 'yes-no',
            answerOptions: [
                { id: 'yes', label: 'Yes' },
                { id: 'no', label: 'No', isCommentRequired: true },
            ],
            categoryId: 'cat_bedroom',
        },
        {
            id: 'q_surfaces_dusted',
            label: 'Are all surfaces dusted and polished?',
            answerType: 'yes-no',
            answerOptions: [
                { id: 'yes', label: 'Yes' },
                { id: 'no', label: 'No', isCommentRequired: true, commentPlaceholder: 'Specify which surfaces are not dusted.' },
            ],
            categoryId: 'cat_bedroom',
        },
        {
            id: 'q_sink_clean',
            label: 'Is the sink and countertop clean and sanitized?',
            answerType: 'yes-no',
            answerOptions: [
                { id: 'yes', label: 'Yes' },
                { id: 'no', label: 'No', isCommentRequired: true },
            ],
            categoryId: 'cat_bathroom',
        },
        {
            id: 'q_toilet_clean',
            label: 'Is the toilet clean and sanitized?',
            answerType: 'yes-no',
            answerOptions: [
                { id: 'yes', label: 'Yes' },
                { id: 'no', label: 'No', isCommentRequired: true },
            ],
            categoryId: 'cat_bathroom',
        },
        {
            id: 'q_towels_stocked',
            label: 'Are towels fresh and fully stocked?',
            answerType: 'yes-no',
            answerOptions: [
                { id: 'yes', label: 'Yes' },
                { id: 'no', label: 'No' },
            ],
            categoryId: 'cat_bathroom',
        },
    ],
};

export const sampleTaskTypes: TaskType[] = [
    { id: 'tt_general_inspection', name: 'General Inspection', categorySelection: 'single', uiLayout: 'single-table', allowedCategoryIds: ['cat_building_safety'], roomEntryLabel: 'Area/Unit' },
    {
        id: 'tt_housekeeping',
        name: 'Housekeeping Checklist',
        categorySelection: 'multiple',
        uiLayout: 'tabs',
        allowedCategoryIds: ['cat_bedroom', 'cat_bathroom', 'cat_building_safety'],
        roomEntryLabel: 'Room Number',
    },
];

export const sampleTaskTypeConfigurations: TaskTypeConfiguration[] = [
    {
        taskTypeId: 'tt_general_inspection',
        enabledCategoryIds: [
            'cat_building_safety',
            'cat_fire_safety',
            'cat_fire_extinguishers',
            'cat_fire_alarms',
        ],
        enabledQuestionIds: [
            'q_extinguisher_present',
            'q_pressure_gauge',
            'q_alarm_panel_faults',
            'q_exits_clear',
        ],
        overrides: [],
    },
     {
        taskTypeId: 'tt_housekeeping',
        enabledCategoryIds: [
            'cat_bedroom',
            'cat_bathroom',
            'cat_building_safety',
            'cat_fire_safety',
            'cat_fire_extinguishers',
        ],
        enabledQuestionIds: [
            'q_bed_linens',
            'q_surfaces_dusted',
            'q_sink_clean',
            'q_toilet_clean',
            'q_towels_stocked',
            'q_exits_clear',
            'q_extinguisher_present',
        ],
        overrides: [],
    },
];

export const sampleSite: Site = {
    id: "demo-site-1",
    name: "Main Office"
};
