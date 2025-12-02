

import { FormElementInstance, Section, Rule, Condition } from "@/lib/types";
import { Workflow } from "@/lib/types";
import { getAllElements, getNestedValue } from "@/lib/utils";

export const evaluateSingleCondition = (condition: Condition, state: { [key: string]: { value: any, fullObject?: any } }) => {
    
    const getConditionValue = (id: string | undefined): any => {
        if (!id) return undefined;

        if (id.startsWith('_')) {
            switch(id) {
                case '_current_date':
                case '_due_date':
                case '_scheduled_date':
                    return new Date().toISOString();
                default:
                    return undefined;
            }
        }
        
        return getNestedValue(state, `${id}.value`);
    }

    let sourceValue: any;
    if (condition.sourceType === 'field') {
        sourceValue = getConditionValue(condition.sourceElementId);
    } else if (condition.sourceType === 'date') {
        sourceValue = getConditionValue(condition.sourceValue);
    } else { // status
        // This part needs to be connected to the actual task status in a real app.
        // For now, we'll assume it's a value that can be passed in or is static.
        // Let's make it 'Open' for demonstration.
        sourceValue = 'Open'; 
    }
    
    if (sourceValue === undefined || sourceValue === null || sourceValue === "") {
        if (condition.operator === 'equals') {
             const comparisonValue = condition.comparisonType === 'value' ? condition.value : getConditionValue(condition.comparisonElementId);
             return comparisonValue === undefined || comparisonValue === null || comparisonValue === "";
        }
        if (condition.operator === 'not_equals') {
             const comparisonValue = condition.comparisonType === 'value' ? condition.value : getConditionValue(condition.comparisonElementId);
             return !(comparisonValue === undefined || comparisonValue === null || comparisonValue === "");
        }
        return false;
    }
    
    let comparisonValue: any;
    if (condition.comparisonType === 'field') {
        comparisonValue = getConditionValue(condition.comparisonElementId);
    } else if (condition.comparisonType === 'date') {
        comparisonValue = getConditionValue(condition.value);
    } else { // 'value' or 'status'
        comparisonValue = condition.value;
    }

    if (comparisonValue === undefined || comparisonValue === null) {
        if(condition.operator === 'not_equals') return true;
        return false;
    }

    const isDateComparison = condition.sourceType === 'date' || condition.comparisonType === 'date';

    if (isDateComparison) {
        try {
            const dateSource = new Date(sourceValue);
            let dateComparison = new Date(comparisonValue);

            if (isNaN(dateSource.getTime()) || isNaN(dateComparison.getTime())) return false;

            dateSource.setHours(0, 0, 0, 0);
            dateComparison.setHours(0, 0, 0, 0);

            if (condition.offsetDays) {
                // The offset is applied to the *source* to compare against the *target*.
                // "If (Source + 2 days) is greater than (Target)"
                dateSource.setDate(dateSource.getDate() + condition.offsetDays);
            }

            switch(condition.operator) {
                case 'equals': return dateSource.getTime() === dateComparison.getTime();
                case 'not_equals': return dateSource.getTime() !== dateComparison.getTime();
                case 'is_greater_than': return dateSource > dateComparison;
                case 'is_less_than': return dateSource < dateComparison;
                default: return false;
            }
        } catch (e) {
            return false;
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

export const evaluateRule = (rule: Rule | Workflow, state: { [key: string]: { value: any } }): boolean => {
    if (!rule || !rule.conditions || rule.conditions.length === 0) return false;
    
    const conditionResults = rule.conditions.map(cond => evaluateSingleCondition(cond, state));

    if (rule.logicType === 'and') {
        return conditionResults.every(res => res);
    } else { // 'or'
        return conditionResults.some(res => res);
    }
};