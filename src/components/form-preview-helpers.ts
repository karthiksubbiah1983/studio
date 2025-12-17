

import { FormElementInstance, Section, Rule, Condition, Configuration } from "@/lib/types";
import { Workflow } from "@/lib/types";
import { getAllElements, getNestedValue } from "@/lib/utils";

export const evaluateSingleCondition = (condition: Condition, state: { [key: string]: any }, configurations?: Configuration[]) => {
    
    const getConditionValue = (type: 'source' | 'comparison', idOrKey?: string): any => {
        if (!idOrKey) return undefined;
        
        const valueType = type === 'source' ? condition.sourceType : condition.comparisonType;

        if (idOrKey.startsWith('_')) {
            switch(idOrKey) {
                case '_current_date':
                case '_due_date':
                case '_scheduled_date':
                    return new Date().toISOString(); 
                default:
                    return undefined;
            }
        }
        
        if (valueType === 'config') {
            const config = (configurations || []).find(c => c.key === idOrKey);
            return config?.value;
        }

        // Check if state is a row context (plain object) vs form state (object of {value, fullObject})
        const isRowContext = state && typeof state === 'object' && !Object.values(state).some(v => typeof v === 'object' && v !== null && 'value' in v);

        // For elements within tables, state is a merge of rowContext and formState.
        // We need to intelligently look up the value.
        // A value in the row context (flat key-value) should take precedence.
        const rowValue = isRowContext ? getNestedValue(state, idOrKey) : undefined;
        if (rowValue !== undefined) {
            return rowValue;
        }

        // If it's a proxy ID (from a table), extract the column key and check the row context again
        const isProxyId = idOrKey.includes("::");
        if (isProxyId) {
             const key = idOrKey.split('::').pop()!;
             const proxyRowValue = getNestedValue(state, key);
             if (proxyRowValue !== undefined) return proxyRowValue;
        }
        
        // Fallback to checking the main form state
        if (state && state[idOrKey] && 'value' in state[idOrKey]) {
            return state[idOrKey].value;
        }
        
        return undefined; // If not found anywhere
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
    }
    else if (condition.comparisonType === 'date' || condition.comparisonType === 'status') {
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

export const evaluateRule = (rule: Rule | Workflow, state: { [key: string]: any }, configurations?: Configuration[], sections?: Section[]): boolean => {
    if (!rule || !rule.conditions || rule.conditions.length === 0) return false;

    const allElements = sections ? getAllElements(sections) : [];

    const checkConditions = (context: { [key: string]: any }): boolean => {
        const conditionResults = rule.conditions.map(cond => evaluateSingleCondition(cond, context, configurations));
        if (rule.logicType === 'and') {
            return conditionResults.every(res => res);
        } else { // 'or'
            return conditionResults.some(res => res);
        }
    };

    // Check if any condition references a table cell.
    const tableCondition = rule.conditions.find(c =>
        c.sourceType === 'field' && c.sourceElementId && c.sourceElementId.includes('::')
    );
    
    if (tableCondition && allElements.length > 0) {
        const sourceIdParts = tableCondition.sourceElementId!.split('::');
        const tableId = sourceIdParts[0];
        const tableElement = allElements.find(el => el.id === tableId) as FormElementInstance | undefined;
        
        if (tableElement && tableElement.type === 'Table' && state[tableId]?.value) {
            const tableRows = state[tableId].value as any[];
            // If any row in the table satisfies the conditions, the rule is met.
            return tableRows.some(row => checkConditions({ ...state, ...row }));
        }
    }

    // Default behavior: evaluate conditions against the main form state.
    return checkConditions(state);
};