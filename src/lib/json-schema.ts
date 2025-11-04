
import { Form, FormElementInstance, Rule, Section } from "./types";

const mapElementToSchemaProperty = (element: FormElementInstance): Record<string, any> => {
    const { type, label, required, helperText, placeholder, options, dataSource, apiUrl, valueKey, labelKey, columns, elements } = element;

    const schemaProperty: Record<string, any> = {
        title: label,
        description: helperText || '',
        ui: {
            component: type
        }
    };

    if (placeholder) {
        schemaProperty.ui.placeholder = placeholder;
    }

    switch (type) {
        case "Input":
        case "Textarea":
        case "RichText":
            schemaProperty.type = "string";
            break;
        case "DatePicker":
            schemaProperty.type = "string";
            schemaProperty.format = "date-time";
            break;
        case "Checkbox":
            schemaProperty.type = "boolean";
            break;
        case "RadioGroup":
            schemaProperty.type = "string";
            if (options) {
                schemaProperty.enum = options;
                schemaProperty.ui.options = options;
            }
            break;
        case "Select":
            schemaProperty.type = "string";
            schemaProperty.ui.dataSource = dataSource;
            if (dataSource === 'static' && options) {
                schemaProperty.enum = options;
                schemaProperty.ui.options = options;
            } else if (dataSource === 'dynamic') {
                schemaProperty.ui.apiUrl = apiUrl;
                schemaProperty.ui.valueKey = valueKey;
                schemaProperty.ui.labelKey = labelKey;
            }
            break;
        case "Table":
            schemaProperty.type = "array";
            const itemSchema: { type: string, properties: any, required: string[], ui: any } = {
                type: "object",
                properties: {},
                required: [],
                ui: {
                    columns: []
                }
            };
            columns?.forEach(col => {
                itemSchema.properties[col.key] = {
                    title: col.title,
                    type: col.cellType === 'checkbox' ? 'boolean' : 'string',
                };
                if (col.options) {
                    itemSchema.properties[col.key].enum = col.options;
                }
                const uiColumnDef: any = {
                    key: col.key,
                    title: col.title,
                    cellType: col.cellType,
                    hidden: col.hidden
                };
                 if (col.options) {
                    uiColumnDef.options = col.options;
                }
                if (col.formula) {
                    uiColumnDef.formula = col.formula;
                }
                itemSchema.ui.columns.push(uiColumnDef);
            });
            schemaProperty.items = itemSchema;
            break;
        case "Container":
            schemaProperty.type = "object";
            schemaProperty.properties = {};
            schemaProperty.required = [];
            elements?.forEach(el => {
                if (el.key) {
                    schemaProperty.properties[el.key] = mapElementToSchemaProperty(el);
                    if (el.required) {
                        schemaProperty.required.push(el.key);
                    }
                }
            });
            break;
        default:
            // For Title, Separator, Display
            return {};
    }

    return schemaProperty;
}

export const generateJsonSchema = (form: Form, sections: Section[], rules: Rule[]) => {
  const latestVersion = form.versions[0];
  
  const schema: {
    title: string;
    description: string;
    type: "object";
    version?: string;
    versionName?: string;
    versionNumber?: number;
    properties: { [key: string]: any };
    required: string[];
    'x-rules'?: Rule[];
  } = {
    title: form.title,
    description: "JSON schema for the generated form",
    type: "object",
    properties: {},
    required: [],
  };

  if (latestVersion) {
    if (latestVersion.type === 'published') {
        schema.versionName = latestVersion.name;
        // Version number is the count of published versions
        schema.versionNumber = form.versions.filter(v => v.type === 'published').length;
    } else {
        schema.version = 'draft';
    }
  }

  if (rules && rules.length > 0) {
    schema['x-rules'] = rules;
  }

  const processElements = (elements: FormElementInstance[]) => {
    for (const element of elements) {
        if (!element.key || element.type === 'Title' || element.type === 'Separator' || element.type === 'Display') {
            continue;
        }

        const propertySchema = mapElementToSchemaProperty(element);
        
        if (Object.keys(propertySchema).length > 0) {
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
