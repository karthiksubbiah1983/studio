
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
                if (includeTableColumns && element.type === 'InputTable' && element.inputColumns) {
                   element.inputColumns.forEach(col => {
                        allElements.push({
                            id: `${element.id}.*.${col.key}`, // Representative ID for rule targeting
                            key: col.key,
                            type: col.element.type,
                            label: `${element.label} > ${col.title}`,
                        } as any);
                   })
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
    
    // If sourceValue is undefined, it can only satisfy 'not_equals' if the comparison value is not also undefined-like.
    if (sourceValue === undefined || sourceValue === null || sourceValue === "") {
        if (condition.operator === 'equals') {
             const comparisonValue = condition.comparisonType === 'static_value' ? condition.value : combinedState[condition.comparisonElementId!]?.value;
             return comparisonValue === undefined || comparisonValue === null || comparisonValue === "";
        }
        if (condition.operator === 'not_equals') {
             const comparisonValue = condition.comparisonType === 'static_value' ? condition.value : combinedState[condition.comparisonElementId!]?.value;
             return !(comparisonValue === undefined || comparisonValue === null || comparisonValue === "");
        }
        return false;
    }
    
    let comparisonValue: any;
    if (condition.comparisonType === 'another_field' && condition.comparisonElementId) {
        comparisonValue = combinedState[condition.comparisonElementId]?.value;
    } else {
        comparisonValue = condition.value;
    }

    // Comparison value might be undefined if the target field isn't filled out yet
    if (comparisonValue === undefined || comparisonValue === null) {
        if(condition.operator === 'not_equals') return true;
        return false;
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
