

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

// This is a duplicate of the function in form-preview-helpers.ts to avoid circular dependencies
// if utils are imported into form-preview-helpers.
export const evaluateRule = (rule: Rule | Workflow, context: { [key: string]: any }, configurations?: Configuration[], sections?: Section[]): boolean => {
  if (!rule || !rule.conditions || rule.conditions.length === 0 || !context) {
    return false;
  }

  const allElements = sections ? getAllElements(sections) : [];

  const evaluateSingleCondition = (condition: Condition) => {
    if (!context) return false;

    const getConditionValue = (type: 'source' | 'comparison', idOrKey: string | undefined): any => {
        if (!idOrKey) return undefined;
        
        const valueType = type === 'source' ? condition.sourceType : condition.comparisonType;
        
        if (idOrKey.startsWith('_')) { // Handle special date values
            switch(idOrKey) {
                case '_current_date': return new Date().toISOString(); 
                case '_due_date': return new Date().toISOString(); // Placeholder
                case '_scheduled_date': return new Date().toISOString(); // Placeholder
                default: return undefined;
            }
        }
        
        if (valueType === 'config') {
            const configKey = `config::${idOrKey}`;
            const value = context[configKey];
             return (value && typeof value === 'object' && 'value' in value) ? value.value : undefined;
        }

        if (idOrKey.includes('::')) {
            const parts = idOrKey.split('::');
            const elementKey = parts.length > 1 ? parts[1] : parts[0]; 
             if(context.hasOwnProperty(elementKey)) {
                const value = context[elementKey];
                return (typeof value === 'object' && value !== null && 'value' in value) ? value.value : value;
            }
        }

        if(context.hasOwnProperty(idOrKey)) {
            const value = context[idOrKey];
            return (typeof value === 'object' && value !== null && 'value' in value) ? value.value : value;
        }
        
        const value = context[idOrKey];
        if (value !== undefined) {
             return (typeof value === 'object' && value !== null && 'value' in value) ? value.value : value;
        }
        
        return undefined;
    }

    let sourceValue: any;
    if (condition.sourceType === 'field') {
        sourceValue = getConditionValue('source', condition.sourceElementId);
    } else { // 'date', 'status', 'config'
        sourceValue = getConditionValue('source', condition.sourceValue);
    }
    
    const isSourceValueEmpty = sourceValue === undefined || sourceValue === null || sourceValue === "";

    let comparisonValue: any;
    if (condition.comparisonType === 'field') {
        comparisonValue = getConditionValue('comparison', condition.comparisonElementId);
    } else if (condition.comparisonType === 'config') {
        comparisonValue = getConditionValue('comparison', condition.value);
    } else if (condition.comparisonType === 'date' || condition.comparisonType === 'status') {
        comparisonValue = getConditionValue('comparison', condition.value);
    } else { // 'value'
        comparisonValue = condition.value;
    }

    const isComparisonValueEmpty = comparisonValue === undefined || comparisonValue === null || comparisonValue === "";
    
    const isNumericComparison = condition.operator === 'is_greater_than' || condition.operator === 'is_less_than';
    
    if (isNumericComparison) {
        let numSource = parseFloat(sourceValue);
        const numComparison = parseFloat(comparisonValue);

        if (condition.offsetValue) {
            numSource += condition.offsetValue;
        }

        if (isNaN(numSource) || isNaN(numComparison)) {
            return false;
        }
        if (condition.operator === 'is_greater_than') {
            return numSource > numComparison;
        }
        if (condition.operator === 'is_less_than') {
            return numSource < numComparison;
        }
    }


    if (condition.operator === 'equals') {
        if (isSourceValueEmpty && isComparisonValueEmpty) return true;
        return String(sourceValue) === String(comparisonValue);
    }
    if (condition.operator === 'not_equals') {
        if (isSourceValueEmpty && isComparisonValueEmpty) return false;
        return String(sourceValue) !== String(comparisonValue);
    }

    if (isSourceValueEmpty) {
        return false;
    }

    const isDateComparison = condition.sourceType === 'date' || condition.comparisonType === 'date';

    if (isDateComparison) {
        try {
            let dateSource = new Date(sourceValue);
            let dateComparison = new Date(comparisonValue);

            if (isNaN(dateSource.getTime()) || isNaN(dateComparison.getTime())) return false;

            dateSource.setHours(0, 0, 0, 0);
            dateComparison.setHours(0, 0, 0, 0);

            if (condition.offsetDays) {
                dateSource.setDate(dateSource.getDate() + condition.offsetDays);
            }

            switch(condition.operator) {
                case 'is_greater_than': return dateSource > dateComparison;
                case 'is_less_than': return dateSource < dateComparison;
                default: return false; 
            }
        } catch (e) {
            return false;
        }
    }

    switch (condition.operator) {
       case 'contains': return String(sourceValue).includes(String(comparisonValue));
       case 'not_contains': return !String(sourceValue).includes(String(comparisonValue));
       default: return false;
    }
  }

  const conditionResults = rule.conditions.map(evaluateSingleCondition);

  if (rule.logicType === 'and') {
    return conditionResults.every((res) => res);
  } else {
    return conditionResults.some((res) => res);
  }
};
