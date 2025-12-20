

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { FormElementInstance, Section } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const flattenObject = (obj: any, parentKey = '', result: Record<string, any> = {}) => {
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const newKey = parentKey ? `${parentKey}.${key}` : key;
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        flattenObject(obj[key], newKey, result);
      } else {
        result[newKey] = obj[key];
      }
    }
  }
  return result;
};

export const getNestedValue = (obj: any, path: string): any => {
    if (!obj || !path) return undefined;
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

export const findFirstArray = (data: any): any[] | null => {
    if (Array.isArray(data)) {
        return data;
    }
    if (typeof data === 'object' && data !== null) {
        // Prioritize common keys for data arrays
        const commonKeys = ["data", "$values", "results", "items", "values", "list"];
        for (const key of commonKeys) {
            if (Array.isArray(data[key])) {
                return data[key];
            }
        }

        // Fallback to search any key
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                const value = data[key];
                if (Array.isArray(value)) {
                    return value;
                }
                if (typeof value === 'object' && value !== null) {
                    const nested = findFirstArray(value);
                    if (nested) {
                        return nested;
                    }
                }
            }
        }
    }
    return null;
}

export const findElementRecursive = (sections: Section[], elementId: string, returnParentTableId: boolean = false): FormElementInstance | null | string => {
    for (const section of sections) {
        if (!section.elements) { 
            continue;
        }
        const find = (elements: FormElementInstance[], parentTableId: string | null = null): FormElementInstance | null | string => {
            for (const el of elements) {
                if (el.id === elementId) {
                    return returnParentTableId ? parentTableId : el;
                }
                
                let newParentTableId = parentTableId;
                if(el.type === 'Table' || el.type === 'DataGrid') {
                    newParentTableId = el.id;
                }

                if (el.elements) {
                    const found = find(el.elements, newParentTableId);
                    if (found) return found;
                }
                 if (el.type === 'Table' && el.tableColumns) {
                    for (const col of el.tableColumns) {
                         if (col.element.id === elementId) { // This check might not be needed if IDs are unique
                            return returnParentTableId ? el.id : col.element;
                        }
                    }
                }
                 if (el.type === 'DataGrid' && el.dataGridColumns) {
                    for (const col of el.dataGridColumns) {
                         if (col.element.id === elementId) {
                            return returnParentTableId ? el.id : col.element;
                        }
                    }
                }
            }
            return null;
        }
        const found = find(section.elements);
        if (found) return found;
    }
    return null;
}

export const getAllElements = (sections: Section[]): (FormElementInstance | Section)[] => {
    const allElementsAndSections: (FormElementInstance | Section)[] = [];
    const processedElements = new Set<string>();

    const findElementsRecursive = (els: FormElementInstance[]): void => {
        els.forEach(element => {
            if (processedElements.has(element.id)) return;
            
            const isSelectable = element.key || element.required || element.exposeForValidation;

            if (element.type === 'Container' && element.elements) {
                if (isSelectable) {
                    allElementsAndSections.push(element);
                    processedElements.add(element.id);
                }
                findElementsRecursive(element.elements);
            } else if (element.type === 'Table' && element.tableColumns) {
                 allElementsAndSections.push(element); // Add the table itself
                 processedElements.add(element.id);
                element.tableColumns.forEach(col => {
                    if ((col.element.required || col.element.exposeForValidation || col.key) && col.key) {
                        const proxyElement: FormElementInstance = {
                            ...col.element,
                            id: `${element.id}::${col.key}`, 
                            label: `${col.label} (in ${element.label})`,
                            key: col.key,
                        };
                        allElementsAndSections.push(proxyElement);
                    }
                });
            } else if (element.type === 'DataGrid' && element.dataGridColumns) {
                allElementsAndSections.push(element);
                processedElements.add(element.id);
                element.dataGridColumns.forEach(col => {
                    if (col.key) {
                        const proxyElement: FormElementInstance = {
                            ...col.element,
                            id: `${element.id}::${col.key}`,
                            label: `${col.label} (in ${element.label})`,
                            key: col.key,
                        };
                        allElementsAndSections.push(proxyElement);
                    }
                });
            } else if (element.type === 'List' && element.enableScoring) {
                 allElementsAndSections.push(element);
                 processedElements.add(element.id);
                 const scoreProxyElement: FormElementInstance = {
                     id: `${element.id}::score`,
                     type: 'Input', // Treat as a number input for rule purposes
                     key: `${element.key}_score`,
                     label: `${element.label} (Score)`,
                     required: false,
                 };
                 allElementsAndSections.push(scoreProxyElement);
            } else if (isSelectable) {
                allElementsAndSections.push(element);
                processedElements.add(element.id);
            }
        });
    };

    if (sections) {
        sections.forEach(section => {
            if (section.exposeForValidation) {
                allElementsAndSections.push({ ...section, label: section.title } as unknown as Section);
            }
            if (section.elements) { // Safeguard added here
                findElementsRecursive(section.elements);
            }
        });
    }

    return allElementsAndSections;
};
