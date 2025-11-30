

import { FormElementInstance, Section, Rule, Condition } from "@/lib/types";

export const getAllElements = (sections: Section[]): (FormElementInstance | Section)[] => {
    let allElements: (FormElementInstance | Section)[] = [];
    sections.forEach(section => {
        const findElementsRecursive = (els: FormElementInstance[]): void => {
            els.forEach(element => {
                allElements.push(element);
                if (element.type === 'Container' && element.elements) {
                    findElementsRecursive(element.elements);
                }
            });
        };
        findElementsRecursive(section.elements);
    });
    return allElements;
};

const evaluateSingleCondition = (condition: Condition, state: { [key: string]: { value: any } }, rowContext: { [key: string]: { value: any } } = {}) => {
    
    const combinedState = { ...state, ...rowContext };
    
    const getConditionValue = (id: string | undefined): any => {
        if (!id) return undefined;
        if (id === '_current_date') return new Date().toISOString();
        return combinedState[id]?.value;
    }
    
    const sourceValue = getConditionValue(condition.sourceElementId);
    
    // If sourceValue is undefined, it can only satisfy 'not_equals' if the comparison value is not also undefined-like.
    if (sourceValue === undefined || sourceValue === null || sourceValue === "") {
        if (condition.operator === 'equals') {
             const comparisonValue = condition.comparisonType === 'static_value' ? condition.value : getConditionValue(condition.comparisonElementId);
             return comparisonValue === undefined || comparisonValue === null || comparisonValue === "";
        }
        if (condition.operator === 'not_equals') {
             const comparisonValue = condition.comparisonType === 'static_value' ? condition.value : getConditionValue(condition.comparisonElementId);
             return !(comparisonValue === undefined || comparisonValue === null || comparisonValue === "");
        }
        return false;
    }
    
    let comparisonValue: any;
    if (condition.comparisonType === 'another_field') {
        comparisonValue = getConditionValue(condition.comparisonElementId);
    } else {
        comparisonValue = condition.value;
    }

    // Comparison value might be undefined if the target field isn't filled out yet
    if (comparisonValue === undefined || comparisonValue === null) {
        if(condition.operator === 'not_equals') return true;
        return false;
    }

    const sourceElement = getAllElements(Object.values(state).map(s => s.fullObject).filter(Boolean) as Section[]).find(el => el.id === condition.sourceElementId);
    const comparisonElement = getAllElements(Object.values(state).map(s => s.fullObject).filter(Boolean) as Section[]).find(el => el.id === condition.comparisonElementId);
    const isDateComparison = (sourceElement && 'type' in sourceElement && sourceElement.type === 'DatePicker') || (comparisonElement && 'type' in comparisonElement && comparisonElement.type === 'DatePicker') || condition.sourceElementId === '_current_date' || condition.comparisonElementId === '_current_date';

    if (isDateComparison) {
        try {
            const dateSource = new Date(sourceValue);
            const dateComparison = new Date(comparisonValue);

            // Check if dates are valid
            if (isNaN(dateSource.getTime()) || isNaN(dateComparison.getTime())) {
                return false;
            }

            switch(condition.operator) {
                case 'equals': return dateSource.getTime() === dateComparison.getTime();
                case 'not_equals': return dateSource.getTime() !== dateComparison.getTime();
                case 'is_greater_than': return dateSource > dateComparison;
                case 'is_less_than': return dateSource < dateComparison;
                default: return false; // Contains/not_contains not applicable for dates
            }
        } catch (e) {
            return false; // Invalid date format
        }
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
    if (!rule || !rule.conditions) return false;
    if (rule.conditions.length === 0) return false;
    
    const conditionResults = rule.conditions.map(cond => evaluateSingleCondition(cond, state, rowContext));

    if (rule.logicType === 'and') {
        return conditionResults.every(res => res);
    } else { // 'or'
        return conditionResults.some(res => res);
    }
};
