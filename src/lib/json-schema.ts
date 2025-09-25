
import { FormElementInstance, Section } from "./types";

const mapElementTypeToJsonSchemaType = (element: FormElementInstance) => {
    switch (element.type) {
        case "Input":
        case "Textarea":
        case "RadioGroup":
        case "RichText":
            return { type: "string" };
        case "DatePicker":
            return { type: "string", format: "date-time" };
        case "Checkbox":
            return { type: "boolean" };
        case "Select":
             const schema: { type: string, enum?: string[] } = { type: "string" };
             if (element.dataSource === 'static' && element.options) {
                schema.enum = element.options;
             }
             return schema;
        case "Table":
            const itemSchema: { type: string, properties: any, required: string[] } = {
                type: "object",
                properties: {},
                required: []
            };
            element.columns?.forEach(col => {
                itemSchema.properties[col.key] = {
                    type: col.cellType === 'checkbox' ? 'boolean' : 'string',
                    title: col.title
                };
                // Assuming all table columns are optional for now
            });
            return {
                type: "array",
                items: itemSchema
            };
        case "Container":
            const containerProperties: any = {};
            const containerRequired: string[] = [];
            element.elements?.forEach(el => {
                if (!el.key) return;
                containerProperties[el.key] = mapElementTypeToJsonSchemaType(el);
                if (el.required) {
                    containerRequired.push(el.key);
                }
            });
            return {
                type: "object",
                properties: containerProperties,
                required: containerRequired
            };
        default:
            return {};
    }
}

const getElementsRecursive = (elements: FormElementInstance[]): FormElementInstance[] => {
    let allElements: FormElementInstance[] = [];
    for (const el of elements) {
        // We only care about elements that can hold a value
        if (el.type !== 'Title' && el.type !== 'Separator' && el.type !== 'Display') {
            allElements.push(el);
        }
        if (el.elements) {
            allElements = allElements.concat(getElementsRecursive(el.elements));
        }
    }
    return allElements;
}


export const generateJsonSchema = (sections: Section[]) => {
  const schema: {
    title: string;
    description: string;
    type: "object";
    properties: { [key: string]: any };
    required: string[];
  } = {
    title: "Form Submission",
    description: "JSON schema for the generated form",
    type: "object",
    properties: {},
    required: [],
  };

  const allElements = sections.flatMap(s => s.elements);

  const processElements = (elements: FormElementInstance[]) => {
    for (const element of elements) {
        if (!element.key || element.type === 'Title' || element.type === 'Separator' || element.type === 'Display') {
            continue;
        }

        const propertySchema = mapElementTypeToJsonSchemaType(element);
        
        schema.properties[element.key] = {
            title: element.label,
            ...propertySchema
        };

        if (element.required) {
            schema.required.push(element.key);
        }
    }
  }

  processElements(allElements);

  return schema;
};
