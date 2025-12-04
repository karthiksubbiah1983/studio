
import { FormElementInstance, Section, Rule, Condition } from "@/lib/types";
import { Workflow } from "@/lib/types";
import { getAllElements, getNestedValue } from "@/lib/utils";

export const evaluateSingleCondition = (condition: Condition, state: { [key: string]: any }) => {
    
    const getConditionValue = (idOrKey: string | undefined): any => {
        if (!idOrKey) return undefined;
        
        // Handle special date values first
        if (idOrKey.startsWith('_')) {
            switch(idOrKey) {
                case '_current_date':
                case '_due_date':
                case '_scheduled_date':
                    // This is a placeholder for actual date logic if needed.
                    // For now, we'll treat them as comparable strings.
                    return new Date().toISOString(); 
                default:
                    return undefined;
            }
        }

        // Check if we are in a table row context by checking for '::' in the source ID
        if (condition.sourceElementId?.includes('::')) {
            // The `state` is the row object. The idOrKey is the column key.
             return getNestedValue(state, idOrKey);
        }

        // Standard form state evaluation
        return getNestedValue(state, `${idOrKey}.value`);
    }

    let sourceValue: any;
    if (condition.sourceType === 'field') {
        const sourceId = condition.sourceElementId || '';
        // If it's a table column proxy, extract the actual key to look up in the row context (state)
        const keyToUse = sourceId.includes('::') ? sourceId.split('::')[1] : sourceId;
        sourceValue = getConditionValue(keyToUse);
    } else if (condition.sourceType === 'date') {
        sourceValue = getConditionValue(condition.sourceValue);
    } else { // status
        sourceValue = 'Open'; // Placeholder for actual status logic
    }
    
    // Treat undefined, null, or empty string as equivalent for comparison purposes
    const isSourceValueEmpty = sourceValue === undefined || sourceValue === null || sourceValue === "";

    let comparisonValue: any;
    if (condition.comparisonType === 'field') {
        const comparisonId = condition.comparisonElementId || '';
        const keyToUse = comparisonId.includes('::') ? comparisonId.split('::')[1] : comparisonId;
        comparisonValue = getConditionValue(keyToUse);
    } else if (condition.comparisonType === 'date') {
        comparisonValue = getConditionValue(condition.value);
    } else { // 'value' or 'status'
        comparisonValue = condition.value;
    }

    const isComparisonValueEmpty = comparisonValue === undefined || comparisonValue === null || comparisonValue === "";

    const isNumericComparison = condition.operator === 'is_greater_than' || condition.operator === 'is_less_than';
    
    if (isNumericComparison) {
        const numSource = parseFloat(sourceValue);
        const numComparison = parseFloat(comparisonValue);
        if (isNaN(numSource) || isNaN(numComparison)) {
            return false; // Cannot perform numeric comparison
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

    // For other operators, if source is empty, it's false.
    if (isSourceValueEmpty) {
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
                // Apply offset to the source date for comparison
                dateSource.setDate(dateSource.getDate() + condition.offsetDays);
            }

            switch(condition.operator) {
                case 'is_greater_than': return dateSource > dateComparison;
                case 'is_less_than': return dateSource < dateComparison;
                default: return false; // Other operators already handled
            }
        } catch (e) {
            return false;
        }
    }

    // Standard string/number comparison for remaining operators
    switch (condition.operator) {
       case 'contains': return String(sourceValue).includes(String(comparisonValue));
       case 'not_contains': return !String(sourceValue).includes(String(comparisonValue));
       default: return false;
    }
}

export const evaluateRule = (rule: Rule | Workflow, state: { [key: string]: any }): boolean => {
    if (!rule || !rule.conditions || rule.conditions.length === 0) return false;
    
    const conditionResults = rule.conditions.map(cond => evaluateSingleCondition(cond, state));

    if (rule.logicType === 'and') {
        return conditionResults.every(res => res);
    } else { // 'or'
        return conditionResults.some(res => res);
    }
};
