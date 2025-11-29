

import { Form, FormElementInstance, Rule, Section } from "./types";

const mapElementToSchemaProperty = (element: FormElementInstance): Record<string, any> => {
    const { 
        type, 
        label, 
        helperText, 
        ...rest 
    } = element;

    // Base schema structure
    const schemaProperty: Record<string, any> = {
        title: label,
        description: helperText || '',
        ui: {
            component: type
        }
    };
    
    // Add all other properties from the element to the 'ui' object
    for (const key in rest) {
        if (Object.prototype.hasOwnProperty.call(rest, key)) {
            const propKey = key as keyof typeof rest;
            if (propKey !== 'id' && propKey !== 'key' && propKey !== 'label' && propKey !== 'helperText') {
                 // @ts-ignore
                schemaProperty.ui[propKey] = rest[propKey];
            }
        }
    }


    switch (type) {
        case "Input":
        case "Textarea":
        case "RichText":
            schemaProperty.type = "string";
            schemaProperty.default = rest.placeholder || "";
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
            schemaProperty.type = "string";
            if (rest.options) {
                schemaProperty.enum = rest.options;
            }
            break;
        case "Select":
            schemaProperty.type = "string";
             if (rest.dataSource === 'static' && rest.options) {
                schemaProperty.enum = rest.options;
            }
            break;
        case "Container":
            schemaProperty.type = "object";
            schemaProperty.properties = {};
            schemaProperty.required = [];
             if (rest.elements) {
                rest.elements.forEach(el => {
                    if (el.key) {
                        schemaProperty.properties[el.key] = mapElementToSchemaProperty(el);
                        if (el.required) {
                            schemaProperty.required.push(el.key);
                        }
                    }
                });
            }
            break;
        default:
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
    properties: { [key:string]: any };
    required: string[];
    'x-rules'?: Rule[];
    'x-ui-sections'?: any[];
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
        schema.versionNumber = form.versions.filter(v => v.type === 'published').length;
    } else {
        schema.version = 'draft';
    }
  }

  if (rules && rules.length > 0) {
    schema['x-rules'] = rules;
  }
  
  schema['x-ui-sections'] = sections.map(section => {
      const getElementKeysRecursive = (elements: FormElementInstance[]): string[] => {
          let keys: string[] = [];
          elements.forEach(el => {
              if (el.key) {
                keys.push(el.key);
              }
              if (el.type === 'Container' && el.elements) {
                  // For containers, we don't add the container key itself, just its children.
                  keys = keys.concat(getElementKeysRecursive(el.elements));
              }
          });
          return keys;
      }
      return {
          id: section.id,
          title: section.title,
          elementKeys: getElementKeysRecursive(section.elements)
      }
  })

  const processElements = (elements: FormElementInstance[]) => {
    for (const element of elements) {
        // Recurse into containers
        if (element.type === 'Container' && element.elements) {
             processElements(element.elements);
        }
        
        // Skip elements that don't have a key or are purely presentational
        if (!element.key || element.type === 'Separator' || element.type === 'Display') {
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
