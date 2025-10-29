import { FormElementInstance, Section, Rule, Condition } from "@/lib/types";

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

const evaluateSingleCondition = (condition: Condition, state: { [key: string]: { value: any } }) => {
    const sourceValue = state[condition.sourceElementId]?.value;
    
    // Treat undefined source value as not meeting the condition, except for 'not_equals'
    if (sourceValue === undefined && condition.operator !== 'not_equals') return false;
    
    let comparisonValue: any;
    if (condition.comparisonType === 'another_field' && condition.comparisonElementId) {
        comparisonValue = state[condition.comparisonElementId]?.value;
        if (comparisonValue === undefined) return false; // Can't compare against an undefined field
    } else {
        comparisonValue = condition.value;
    }

    // Handle boolean "true"/"false" strings from checkboxes
    const normalizedSourceValue = typeof sourceValue === 'boolean' ? String(sourceValue) : sourceValue;

    switch (condition.operator) {
       case 'equals': return String(normalizedSourceValue) === String(comparisonValue);
       case 'not_equals': return String(normalizedSourceValue) !== String(comparisonValue);
       case 'contains': return String(normalizedSourceValue).includes(String(comparisonValue));
       case 'not_contains': return !String(normalizedSourceValue).includes(String(comparisonValue));
       case 'is_greater_than': {
            const numSource = parseFloat(normalizedSourceValue);
            const numComparison = parseFloat(comparisonValue);
            return !isNaN(numSource) && !isNaN(numComparison) && numSource > numComparison;
       }
       case 'is_less_than': {
            const numSource = parseFloat(normalizedSourceValue);
            const numComparison = parseFloat(comparisonValue);
            return !isNaN(numSource) && !isNaN(numComparison) && numSource < numComparison;
       }
       default: return false;
    }
}

export const evaluateRule = (rule: Rule, state: { [key: string]: { value: any } }): boolean => {
    const conditionResults = rule.conditions.map(cond => evaluateSingleCondition(cond, state));

    if (rule.logicType === 'and') {
        return conditionResults.every(res => res);
    } else { // 'or'
        return conditionResults.some(res => res);
    }
};
