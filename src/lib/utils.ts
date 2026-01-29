
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
                 };
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

const evaluateSingleCondition = (
    condition: Condition,
    globalContext: { [key: string]: any },
    allElements: (FormElementInstance | Section)[],
    configurations?: Configuration[],
    rowContext?: any
): boolean => {
    const sourceElement = allElements.find(el => el.id === condition.sourceElementId) as (FormElementInstance & { isTableColumn?: boolean }) | undefined;
    let sourceValue: any;

    // 1. Get the source value based on its type and context
    if (condition.sourceType === 'field' && sourceElement) {
        const elementState = globalContext[sourceElement.id];
        
        if (sourceElement.isTableColumn && rowContext && sourceElement.key) {
             sourceValue = getNestedValue(rowContext, sourceElement.key);
        } else if (elementState) {
            if (condition.sourcePropertyKey) {
                const { fullObject } = elementState;
                if (Array.isArray(fullObject)) { // Multi-select component (e.g., checkbox list)
                    sourceValue = fullObject.map(item => getNestedValue(item, condition.sourcePropertyKey!));
                } else if (fullObject && typeof fullObject === 'object') { // Single-select component (e.g., radio list)
                    sourceValue = getNestedValue(fullObject, condition.sourcePropertyKey);
                } else {
                    sourceValue = undefined; // No object to get property from
                }
            } else {
                sourceValue = elementState.value; // Default to the primary value
            }
        }
    } else if (condition.sourceType === 'config' && condition.sourceValue && configurations) {
        sourceValue = configurations.find(c => c.key === condition.sourceValue)?.value;
    } else { // Dates, direct values etc.
        sourceValue = condition.sourceValue;
    }

    // 2. Get the comparison value
    let comparisonValue: any;
    if (condition.comparisonType === 'field' && condition.comparisonElementId) {
        const comparisonElement = allElements.find(el => el.id === condition.comparisonElementId) as (FormElementInstance & { isTableColumn?: boolean }) | undefined;
        if (comparisonElement && comparisonElement.isTableColumn && rowContext && comparisonElement.key) {
             comparisonValue = getNestedValue(rowContext, comparisonElement.key);
        } else if (comparisonElement && globalContext[comparisonElement.id]) {
            comparisonValue = globalContext[comparisonElement.id].value;
        }
    } else {
        comparisonValue = condition.value;
    }

    // 3. Perform the comparison
    const normalize = (val: any): string => (val === undefined || val === null) ? "" : String(val);

    const sourceIsArray = Array.isArray(sourceValue);

    // Main comparison logic
    switch (condition.operator) {
        case 'equals':
            if (sourceIsArray) {
                // True if ANY item in the source array equals the comparison value
                return sourceValue.some(v => normalize(v) === normalize(comparisonValue));
            }
            return normalize(sourceValue) === normalize(comparisonValue);
            
        case 'not_equals':
            if (sourceIsArray) {
                // True if ALL items in the source array do NOT equal the comparison value
                return !sourceValue.some(v => normalize(v) === normalize(comparisonValue));
            }
            return normalize(sourceValue) !== normalize(comparisonValue);

        case 'contains':
            if (sourceIsArray) {
                // True if ANY item in the source array contains the comparison value string
                return sourceValue.some(v => normalize(v).includes(normalize(comparisonValue)));
            }
            return normalize(sourceValue).includes(normalize(comparisonValue));

        case 'not_contains':
            if (sourceIsArray) {
                // True if NO items in the source array contain the comparison value string
                return !sourceValue.some(v => normalize(v).includes(normalize(comparisonValue)));
            }
            return !normalize(sourceValue).includes(normalize(comparisonValue));
        
        // Numeric/Date comparisons
        case 'is_greater_than':
        case 'is_less_than':
        case 'is_greater_than_or_equal_to':
        case 'is_less_than_or_equal_to':
            const numSource = parseFloat(sourceValue);
            const numComparison = parseFloat(comparisonValue);

            // If either value is not a number, the comparison is invalid and returns false.
            if (isNaN(numSource) || isNaN(numComparison)) return false;

            switch(condition.operator) {
                case 'is_greater_than': return numSource > numComparison;
                case 'is_less_than': return numSource < numComparison;
                case 'is_greater_than_or_equal_to': return numSource >= numComparison;
                case 'is_less_than_or_equal_to': return numSource <= numComparison;
            }
            return false;

        default:
            return false;
    }
};

export const evaluateRule = (
    rule: Rule | Workflow, 
    context: { [key: string]: any }, 
    configurations?: Configuration[], 
    sections?: Section[],
    rowContext?: any
): boolean => {
  if (!rule || !rule.conditions || rule.conditions.length === 0 || !context) {
    return false;
  }

  const allElements = sections ? getAllElements(sections) : [];

  const conditionResults = rule.conditions.map((cond) =>
    evaluateSingleCondition(cond, context, allElements, configurations, rowContext)
  );

  if (rule.logicType === 'and') {
    return conditionResults.every((res) => res);
  } else {
    return conditionResults.some((res) => res);
  }
};
