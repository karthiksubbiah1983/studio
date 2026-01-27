
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

const isDateRelated = (element: FormElementInstance | Section | null) => {
    if (!element) return false;
    if ('type' in element) return element.type === 'DatePicker';
    return false;
};

// Helper function that performs the actual comparison for a condition
function checkConditionAgainstValue(
    sourceValue: any,
    condition: Condition,
    globalContext: { [key: string]: any },
    allElements: (FormElementInstance | Section)[],
    configurations: Configuration[] | undefined,
    rowContext?: any
) {
    const isSourceValueEmpty = sourceValue === undefined || sourceValue === null || sourceValue === "";

    let comparisonValue: any;
    // Determine the comparison value based on its type
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

    const isComparisonValueEmpty = comparisonValue === undefined || comparisonValue === null || comparisonValue === "";

    // Numeric Comparisons
    const isNumericComparison = ['is_greater_than', 'is_less_than', 'is_greater_than_or_equal_to', 'is_less_than_or_equal_to'].includes(condition.operator);
    if (isNumericComparison) {
        let numSource = parseFloat(sourceValue);
        const numComparison = parseFloat(comparisonValue);
        if (condition.offsetValue) numSource += condition.offsetValue;
        if (isNaN(numSource) || isNaN(numComparison)) return false;
        if (condition.operator === 'is_greater_than') return numSource > numComparison;
        if (condition.operator === 'is_less_than') return numSource < numComparison;
        if (condition.operator === 'is_greater_than_or_equal_to') return numSource >= numComparison;
        if (condition.operator === 'is_less_than_or_equal_to') return numSource <= numComparison;
    }

    // Equality Checks
    if (condition.operator === 'equals') {
        if (isSourceValueEmpty) {
            // Source is empty, so it can only equal an also-empty comparison value.
            return isComparisonValueEmpty;
        }
        // If source is not empty, perform a direct comparison.
        return String(sourceValue) === String(comparisonValue);
    }
    if (condition.operator === 'not_equals') {
        if (isSourceValueEmpty) {
            // Source is empty, so it does not equal a non-empty comparison value.
            return !isComparisonValueEmpty;
        }
        // If source is not empty, perform a direct comparison.
        return String(sourceValue) !== String(comparisonValue);
    }

    // String/Date comparisons require non-empty source value from this point on
    if (isSourceValueEmpty) return false;

    // Date Comparisons
    const sourceElement = allElements.find(el => el.id === condition.sourceElementId) as FormElementInstance | undefined;
    const comparisonElement = allElements.find(el => el.id === condition.comparisonElementId) as FormElementInstance | undefined;
    const isDateComparison = condition.sourceType === 'date' || condition.comparisonType === 'date' || isDateRelated(sourceElement) || isDateRelated(comparisonElement);

    if (isDateComparison) {
        try {
            let dateSource = new Date(sourceValue);
            let dateComparison = new Date(comparisonValue);
            if (isNaN(dateSource.getTime()) || isNaN(dateComparison.getTime())) return false;
            // ... date offset logic ...
            switch(condition.operator) {
                case 'is_greater_than': return dateSource > dateComparison;
                case 'is_less_than': return dateSource < dateComparison;
                case 'is_greater_than_or_equal_to': return dateSource >= dateComparison;
                case 'is_less_than_or_equal_to': return dateSource <= dateComparison;
                default: return false; 
            }
        } catch (e) { return false; }
    }

    // String contains
    switch (condition.operator) {
       case 'contains': return String(sourceValue).includes(String(comparisonValue));
       case 'not_contains': return !String(sourceValue).includes(String(comparisonValue));
       default: return false;
    }
}


export const evaluateSingleCondition = (
    condition: Condition,
    globalContext: { [key: string]: any },
    allElements: (FormElementInstance | Section)[],
    configurations?: Configuration[],
    rowContext?: any
): boolean => {
    const sourceElement = allElements.find(el => el.id === condition.sourceElementId) as (FormElementInstance & { isTableColumn?: boolean }) | undefined;

    let sourceValue: any;

    // Unified value retrieval logic
    if (condition.sourceType === 'field' && sourceElement) {
       if (sourceElement.isTableColumn && rowContext && sourceElement.key) {
            sourceValue = getNestedValue(rowContext, sourceElement.key);
       } else {
            sourceValue = globalContext[sourceElement.id]?.value;
       }
    } else if (condition.sourceType === 'config' && condition.sourceValue && configurations) {
        sourceValue = configurations.find(c => c.key === condition.sourceValue)?.value;
    } else if (condition.sourceType !== 'field') {
        sourceValue = condition.sourceValue;
    }
    
    return checkConditionAgainstValue(sourceValue, condition, globalContext, allElements, configurations, rowContext);
}


export const evaluateRule = (
    rule: Rule | Workflow, 
    context: { [key: string]: any }, 
    configurations?: Configuration[], 
    sections?: Section[],
    rowContext?: any // NEW: Optional context for the specific row being evaluated
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

