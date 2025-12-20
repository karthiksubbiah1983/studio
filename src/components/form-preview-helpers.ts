
import { FormElementInstance, Section, Rule, Condition, Configuration } from "@/lib/types";
import { Workflow } from "@/lib/types";
import { getAllElements, getNestedValue, findElementRecursive } from "@/lib/utils";

export const evaluateSingleCondition = (condition: Condition, state: { [key: string]: any }, allElements: (FormElementInstance | Section)[], configurations?: Configuration[]) => {
    
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

        // If 'state' is the row context from a table, it has direct keys like 'column_key'
        const columnKey = idOrKey.includes('::') ? idOrKey.split('::')[1] : idOrKey;

        if (state && state[columnKey] !== undefined) {
             const val = state[columnKey];
             if (typeof val === 'object' && val !== null && 'value' in val) {
                return val.value;
            }
            return val;
        }

        // Fallback for main form state structure { elementId: { value: '...' } }
        if (state && state[idOrKey] !== undefined) {
            if (typeof state[idOrKey] === 'object' && state[idOrKey] !== null && 'value' in state[idOrKey]) {
                return state[idOrKey].value;
            }
            return state[idOrKey];
        }

        // Fallback to default value if not in state
        const element = findElementRecursive(allElements as Section[], idOrKey);
        if (element && 'defaultValue' in element) {
            return element.defaultValue;
        }
        
        return undefined; // If not found anywhere
    }

    let sourceValue: any;
    if (condition.sourceType === 'field' && condition.sourceElementId) {
        sourceValue = getConditionValue('source', condition.sourceElementId);
    } else { // 'date', 'status', 'config'
        sourceValue = getConditionValue('source', condition.sourceValue);
    }
    
    const isSourceValueEmpty = sourceValue === undefined || sourceValue === null || sourceValue === "";

    let comparisonValue: any;
    if (condition.comparisonType === 'field' && condition.comparisonElementId) {
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
    
    const isRuleTableBased = (r: Rule | Workflow): [boolean, string | null] => {
        for (const condition of r.conditions) {
            const sourceElement = allElements.find(el => el.id === condition.sourceElementId);
            if (sourceElement && findElementRecursive(sections || [], sourceElement.id, true)) {
                return [true, findElementRecursive(sections || [], sourceElement.id, true) as string];
            }
            const comparisonElement = allElements.find(el => el.id === condition.comparisonElementId);
            if (comparisonElement && findElementRecursive(sections || [], comparisonElement.id, true)) {
                 return [true, findElementRecursive(sections || [], comparisonElement.id, true) as string];
            }
        }
        return [false, null];
    }
    
    // This function checks if the state we are evaluating is a single row's context.
    const isStateForRow = (s: any): s is Record<string, any> => {
        // A row context is a flat object of key-value pairs, not the complex form state.
        return s && typeof s === 'object' && !s.hasOwnProperty('forms') && !s.hasOwnProperty('categories') && !Object.values(s).some(v => typeof v === 'object' && v !== null && 'value' in v);
    }

    // If the state is a single row's data, we are evaluating for an element *inside* a table.
    // Evaluate the rule only against this specific row's context.
    if (isStateForRow(state)) {
        const conditionResults = rule.conditions.map(cond => evaluateSingleCondition(cond, state, allElements, configurations));
        return rule.logicType === 'and' ? conditionResults.every(res => res) : conditionResults.some(res => res);
    }
    
    // If we reach here, we are evaluating for an element *outside* a table.
    const [isTableBased, tableId] = isRuleTableBased(rule);

    // If the rule is based on a table and we have the table's data in the main state...
    if (isTableBased && tableId && state[tableId]?.value) {
        const tableRows = state[tableId].value as any[];
        // Check if ANY row in the table satisfies the rule.
        const isAnyRowTrue = tableRows.some(row => {
            // For each row, create the evaluation context (main form state + current row data).
            const rowEvaluationContext = { ...state, ...row };
            const conditionResults = rule.conditions.map(cond => evaluateSingleCondition(cond, rowEvaluationContext, allElements, configurations));
            return rule.logicType === 'and' ? conditionResults.every(res => res) : conditionResults.some(res => res);
        });
        return isAnyRowTrue;
    }

    // If the rule is not table-based, perform a standard evaluation against the main form state.
    const conditionResults = rule.conditions.map(cond => evaluateSingleCondition(cond, state, allElements, configurations));
    
    if (rule.logicType === 'and') {
        return conditionResults.every(res => res);
    } else { // 'or'
        return conditionResults.some(res => res);
    }
};
