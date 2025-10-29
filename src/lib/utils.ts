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
    if (!path) return obj;
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

export const findFirstArray = (data: any): any[] | null => {
    if (Array.isArray(data)) {
        return data;
    }
    if (typeof data === 'object' && data !== null) {
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

export const findElementRecursive = (sections: Section[], elementId: string): FormElementInstance | null => {
    for (const section of sections) {
        const find = (elements: FormElementInstance[]): FormElementInstance | null => {
            for (const el of elements) {
                if (el.id === elementId) return el;
                if (el.elements) {
                    const found = find(el.elements);
                    if (found) return found;
                }
            }
            return null;
        }
        const found = find(section.elements);
        if (found) return found;
    }
    return null;
}

export const getAllElements = (sections: Section[], includeTableColumns = false): FormElementInstance[] => {
    let allElements: FormElementInstance[] = [];
    sections.forEach(section => {
        const findElementsRecursive = (els: FormElementInstance[]): void => {
            els.forEach(element => {
                allElements.push(element);
                if (element.type === 'Container' && element.elements) {
                    findElementsRecursive(element.elements);
                }
                if (includeTableColumns && element.type === 'Table' && element.columns) {
                    element.columns.forEach(col => {
                        // Treat each column as a pseudo-element for rule targeting
                        allElements.push({
                            id: `${element.id}.${col.key}`,
                            key: `${element.key}.${col.key}`, // Unique key for the column
                            type: col.cellType || 'text', // Or map to a more specific pseudo-type
                            label: `${element.label} > ${col.title}`,
                            required: false, // Individual table cells might not be "required" in the same way
                        } as FormElementInstance);
                    });
                }
            });
        };
        findElementsRecursive(section.elements);
    });
    return allElements;
};
