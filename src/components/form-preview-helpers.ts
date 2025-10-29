
import { FormElementInstance, Section, Rule, Condition } from "@/lib/types";

export const getAllElements = (sections: Section[]): FormElementInstance[] => {
    let allElements: FormElementInstance[] = [];
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

const evaluateSingleCondition = (condition: Condition, state: { [key: string]: { value: any } }) => {
    const sourceValue = state[condition.sourceElementId]?.value;
    
    if (sourceValue === undefined) return false;
    
    let comparisonValue: any;
    if (condition.comparisonType === 'another_field') {
        comparisonValue = state[condition.comparisonElementId!]?.value;
        if (comparisonValue === undefined) return false;
    } else {
        comparisonValue = condition.value;
    }

    switch (condition.operator) {
       case 'equals': return String(sourceValue) === String(comparisonValue);
       case 'not_equals': return String(sourceValue) !== String(comparisonValue);
       case 'contains': return String(sourceValue).includes(String(comparisonValue));
       case 'not_contains': return !String(sourceValue).includes(String(comparisonValue));
       case 'is_greater_than': return Number(sourceValue) > Number(comparisonValue);
       case 'is_less_than': return Number(sourceValue) < Number(comparisonValue);
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
