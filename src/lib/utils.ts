

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { FormElementInstance, Section, Rule, Workflow, Condition, Configuration } from "./types";

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

export const fetchFromApi = async (url: string) => {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`API call failed with status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Failed to fetch from API:", error);
        return null;
    }
}


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

export const findElementRecursive = (sections: Section[], elementId: string): (FormElementInstance & { isTableColumn?: boolean }) | null => {
    for (const section of sections) {
        if (!section.elements) { 
            continue;
        }
        const find = (elements: FormElementInstance[]): (FormElementInstance & { isTableColumn?: boolean }) | null => {
            for (const el of elements) {
                if (el.id === elementId) {
                    return el;
                }
                 if (el.type === 'DataGrid' && el.dataGridColumns) {
                    for (const col of el.dataGridColumns) {
                         if (col.element.id === elementId) {
                            return { ...col.element, isTableColumn: true };
                        }
                    }
                }
                if (el.type === 'EditableTable' && el.columns) {
                    for (const col of el.columns) {
                        if (col.element.id === elementId) {
                            return { ...col.element, isTableColumn: true };
                        }
                    }
                }
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


export const getAllElements = (sections: Section[]): (FormElementInstance & { isTableColumn?: boolean })[] => {
    const allElementsAndSections: (FormElementInstance & { isTableColumn?: boolean })[] = [];
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
            } else if (element.type === 'DataGrid' && element.dataGridColumns) {
                 allElementsAndSections.push(element);
                 processedElements.add(element.id);
                 element.dataGridColumns.forEach(col => {
                    const colElement = { ...col.element, id: col.element.id, label: `${element.label} > ${col.header}`, isTableColumn: true };
                    allElementsAndSections.push(colElement);
                    processedElements.add(col.element.id);
                 })
            } else if ((element.type === 'List' || element.type === 'DataList') && element.enableScoring) {
                 allElementsAndSections.push(element);
                 processedElements.add(element.id);
                 const scoreProxyElement: FormElementInstance = {
                     id: `${element.id}::score`,
                     type: 'Input', // Treat as a number input for rule purposes
                     key: `${element.key}_score`,
                     label: `${element.label} (Score)`,
                     required: false,
                 } as any;
                 allElementsAndSections.push(scoreProxyElement);
            } else if ((element.type === 'EditableTable' || element.type === 'PayrollTable') && element.columns) {
                 allElementsAndSections.push(element);
                 processedElements.add(element.id);
                 element.columns.forEach(col => {
                    // Make column elements selectable in rules
                    const colElement = { ...col.element, id: col.element.id, label: `${element.label} > ${col.label}`, isTableColumn: true };
                    allElementsAndSections.push(colElement);
                    processedElements.add(col.element.id);
                 })
            } else if (isSelectable) {
                allElementsAndSections.push(element);
                processedElements.add(element.id);
            }
        });
    };

    if (sections) {
        sections.forEach(section => {
            if (section.exposeForValidation) {
                allElementsAndSections.push({ ...section, label: section.title } as unknown as FormElementInstance);
            }
            if (section.elements) { // Safeguard added here
                findElementsRecursive(section.elements);
            }
        });
    }

    return allElementsAndSections;
};


export const findParentTable = (allElements: (FormElementInstance | Section)[], childElementId: string): FormElementInstance | null => {
    const editableTables = allElements.filter(el => el.type === 'EditableTable') as FormElementInstance[];
    for (const table of editableTables) {
        if (table.columns?.some(col => col.element.id === childElementId)) {
            return table;
        }
    }
    return null;
}

export const evaluateRule = (
    rule: Rule | Workflow,
    context: { [key: string]: any },
    configurations?: Configuration[],
    sections?: Section[],
    rowContext?: any
): boolean => {
    if (!rule?.conditions?.length || !context) {
        return false;
    }

    const executionContext = rowContext ? { ...context, ...rowContext } : context;

    const checkCondition = (condition: Condition): boolean => {
        let sourceValue: any;
        const { sourceElementId, sourcePropertyKey, sourceType, sourceValue: configOrDateValue, operator } = condition;
        
        if (sourceType === 'field' && sourceElementId) {
            const elementState = executionContext[sourceElementId];
            if (elementState && sourcePropertyKey) {
                const fullObject = elementState.fullObject;
                if (fullObject) {
                    if (Array.isArray(fullObject)) {
                        sourceValue = fullObject.map(obj => getNestedValue(obj, sourcePropertyKey));
                    } else {
                        sourceValue = getNestedValue(fullObject, sourcePropertyKey);
                    }
                }
            } else if (elementState) {
                sourceValue = elementState.value;
            }
        } else if (sourceType === 'config' && configOrDateValue && configurations) {
            sourceValue = configurations.find(c => c.key === configOrDateValue)?.value;
        }

        let comparisonValue: any;
        if (condition.comparisonType === 'value') {
            comparisonValue = condition.value;
        } else if (condition.comparisonType === 'field' && condition.comparisonElementId) {
            const comparisonElementState = executionContext[condition.comparisonElementId];
            if (comparisonElementState) {
                if (condition.comparisonPropertyKey) {
                    const fullObject = comparisonElementState.fullObject;
                     if (fullObject) {
                        if (Array.isArray(fullObject)) {
                           comparisonValue = fullObject.map(obj => getNestedValue(obj, condition.comparisonPropertyKey!));
                        } else {
                           comparisonValue = getNestedValue(fullObject, condition.comparisonPropertyKey);
                        }
                    }
                } else {
                    comparisonValue = comparisonElementState.value;
                }
            }
        }

        const val1 = sourceValue;
        const val2 = comparisonValue;
        const num1 = parseFloat(val1);
        const num2 = parseFloat(val2);
        const isNumericComparison = !isNaN(num1) && !isNaN(num2);

        switch (operator) {
            case 'equals':
                if (isNumericComparison) return num1 === num2;
                return String(val1 ?? '') === String(val2 ?? '');
            case 'not_equals':
                if (isNumericComparison) return num1 !== num2;
                return String(val1 ?? '') !== String(val2 ?? '');
            case 'contains':
                if (Array.isArray(val1)) {
                    return val1.map(String).includes(String(val2 ?? ''));
                }
                return String(val1 ?? '').includes(String(val2 ?? ''));
            case 'not_contains':
                if (Array.isArray(val1)) {
                    return !val1.map(String).includes(String(val2 ?? ''));
                }
                return !String(val1 ?? '').includes(String(val2 ?? ''));
            case 'is_greater_than':
                return isNumericComparison && num1 > num2;
            case 'is_less_than':
                return isNumericComparison && num1 < num2;
            case 'is_greater_than_or_equal_to':
                return isNumericComparison && num1 >= num2;
            case 'is_less_than_or_equal_to':
                return isNumericComparison && num1 <= num2;
            default:
                return false;
        }
    };

    const conditionResults = rule.conditions.map(checkCondition);

    if (rule.logicType === 'and') {
        return conditionResults.every(result => result);
    } else {
        return conditionResults.some(result => result);
    }
};
