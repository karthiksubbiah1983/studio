import { FormElementInstance, Section, Rule, Condition } from "@/lib/types";

export const getAllElements = (sections: Section[], includeTableColumns = false): (FormElementInstance | Section)[] => {
    let allElements: (FormElementInstance | Section)[] = [];
    sections.forEach(section => {
        const findElementsRecursive = (els: FormElementInstance[]): void => {
            els.forEach(element => {
                allElements.push(element);
                if (element.type === 'Container' && element.elements) {
                    findElementsRecursive(element.elements);
                }
                if (includeTableColumns && element.type === 'Table' && element.columns) {
                    element.columns.forEach(col => {
                        allElements.push({
                            id: `${element.id}.${col.key}`,
                            key: `${element.key}.${col.key}`, 
                            type: col.cellType || 'text',
                            label: `${element.label} > ${col.title}`,
                            options: col.options,
                        } as FormElementInstance);
                    });
                }
            });
        };
        findElementsRecursive(section.elements);
    });
    return allElements;
};

const evaluateSingleCondition = (condition: Condition, state: { [key: string]: { value: any } }, rowContext: { [key: string]: { value: any } } = {}) => {
    
    const combinedState = { ...state, ...rowContext };
    
    const sourceValue = combinedState[condition.sourceElementId]?.value;
    
    if (sourceValue === undefined && condition.operator !== 'not_equals') return false;
    
    let comparisonValue: any;
    if (condition.comparisonType === 'another_field' && condition.comparisonElementId) {
        comparisonValue = combinedState[condition.comparisonElementId]?.value;
        if (comparisonValue === undefined) return false;
    } else {
        comparisonValue = condition.value;
    }

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

export const evaluateRule = (rule: Rule, state: { [key: string]: { value: any } }, rowContext?: { [key: string]: { value: any } }): boolean => {
    if (rule.conditions.length === 0) return false;
    const conditionResults = rule.conditions.map(cond => evaluateSingleCondition(cond, state, rowContext));

    if (rule.logicType === 'and') {
        return conditionResults.every(res => res);
    } else { // 'or'
        return conditionResults.some(res => res);
    }
};
