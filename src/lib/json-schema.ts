

import { Form, FormElementInstance, Rule, Section, Workflow } from "./types";

const mapElementToSchemaProperty = (element: FormElementInstance): Record<string, any> | null => {
    // Only create properties for elements that have a key and are not purely for display
    if (!element.key || element.type === 'Separator' || element.type === 'Display' || element.type === 'Container') {
        return null;
    }

    const { 
        type, 
        label, 
        helperText,
        ...rest 
    } = element;

    const schemaProperty: Record<string, any> = {
        title: label,
        description: helperText || '',
        'x-ui-component': type,
        'x-ui-configuration': { ...rest }
    };
    
    switch (type) {
        case "Input":
        case "Textarea":
        case "RichText":
            schemaProperty.type = "string";
            if(rest.placeholder) schemaProperty.default = rest.placeholder;
            break;
        case "DatePicker":
            schemaProperty.type = "string";
            schemaProperty.format = "date-time";
            break;
        case "Checkbox":
            schemaProperty.type = "boolean";
            schemaProperty.default = false;
            break;
        case "RadioGroup":
        case "Select":
            schemaProperty.type = "string";
            if (rest.options) {
                schemaProperty.enum = rest.options;
            }
            break;
        case "Table":
            schemaProperty.type = "array";
            schemaProperty.items = {
                type: "object",
                properties: {},
                required: [],
            };
            if (rest.tableColumns) {
                rest.tableColumns.forEach(col => {
                    const colProp = mapElementToSchemaProperty(col.element);
                    if (col.key && colProp) {
                        schemaProperty.items.properties[col.key] = colProp;
                        if (col.element.required) {
                             schemaProperty.items.required.push(col.key);
                        }
                    }
                });
            }
            break;
        case "FileUpload":
             schemaProperty.type = "array";
             schemaProperty.items = {
                 type: "object",
                 properties: {
                     name: { type: "string" },
                     type: { type: "string" },
                     size: { type: "number" },
                 }
             }
             if (!rest.multiple) {
                 schemaProperty.maxItems = 1;
             }
            break;
        default:
            // For other types like Preview, they don't map to a data property
            return null;
    }

    return schemaProperty;
}

export const generateJsonSchema = (form: Form, sections: Section[], rules: Rule[], workflows: Workflow[]) => {
  const latestVersion = form.versions[0];
  
  const schema: {
    title: string;
    description: string;
    type: "object";
    formId: string;
    versionId: string;
    versionName?: string;
    versionNumber?: number;
    properties: { [key:string]: any };
    required: string[];
    'x-rules'?: Rule[];
    'x-workflows'?: Workflow[];
    'x-ui-layout': {
        sections: Section[]
    };
  } = {
    title: form.title,
    description: "JSON schema for the generated form",
    type: "object",
    formId: form.id,
    versionId: latestVersion.id,
    properties: {},
    required: [],
    'x-ui-layout': {
        sections: sections,
    }
  };

  if (latestVersion) {
    if (latestVersion.type === 'published') {
        schema.versionName = latestVersion.name;
        const publishedCount = form.versions.filter(v => v.type === 'published').length;
        const publishedIndex = form.versions.filter(v => v.type === 'published').findIndex(v => v.id === latestVersion.id);
        schema.versionNumber = publishedCount - publishedIndex;

    } else {
        schema.versionName = 'draft';
    }
  }

  if (rules && rules.length > 0) {
    schema['x-rules'] = rules;
  }
  
  if (workflows && workflows.length > 0) {
    schema['x-workflows'] = workflows;
  }
  
  const processElements = (elements: FormElementInstance[]) => {
    for (const element of elements) {
        // Recurse into containers
        if (element.type === 'Container' && element.elements) {
             processElements(element.elements);
        }
        
        if (!element.key) {
            continue;
        }

        const propertySchema = mapElementToSchemaProperty(element);
        
        if (propertySchema) {
            schema.properties[element.key] = propertySchema;

            if (element.required) {
                schema.required.push(element.key);
            }
        }
    }
  }
  
  const allElements = sections.flatMap(s => s.elements);
  processElements(allElements);

  return schema;
};
