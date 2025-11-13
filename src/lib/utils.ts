

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

export const getAllElements = (sections: Section[]): FormElementInstance[] => {
    const allElements: FormElementInstance[] = [];
    const processedElements = new Set<string>();

    const findElementsRecursive = (els: FormElementInstance[]): void => {
        els.forEach(element => {
            if (processedElements.has(element.id)) return;
            
            allElements.push(element);
            processedElements.add(element.id);

            if (element.type === 'Container' && element.elements) {
                findElementsRecursive(element.elements);
            }
            if (element.type === 'Table' && element.tableColumns) {
                element.tableColumns.forEach(col => {
                    // This is a template element, it should be included for rule configuration
                    // but we need to avoid processing it in a way that causes infinite recursion if it's nested.
                    if (!processedElements.has(col.element.id)) {
                        allElements.push(col.element);
                        processedElements.add(col.element.id);
                    }
                });
            }
        });
    };

    sections.forEach(section => {
        findElementsRecursive(section.elements);
    });

    return allElements;
};
