

import { FormElementInstance, Section, Rule, Condition, Configuration } from "@/lib/types";
import { Workflow } from "@/lib/types";
import { findElementRecursive, getAllElements, getNestedValue } from "@/lib/utils";

export const evaluateSingleCondition = (condition: Condition, context: { [key: string]: any }, allElements: (FormElementInstance | Section)[], configurations?: Configuration[]) => {
    if (!context) return false;

    const getConditionValue = (type: 'source' | 'comparison', idOrKey: string | undefined): any => {
        if (!idOrKey) return undefined;
        
        const valueType = type === 'source' ? condition.sourceType : condition.comparisonType;

        if (idOrKey.startsWith('_')) { // Handle special date values
            switch(idOrKey) {
                case '_current_date': return new Date().toISOString(); 
                case '_due_date': return new Date().toISOString(); // Placeholder
                case '_scheduled_date': return new Date().toISOString(); // Placeholder
                default: return undefined;
            }
        }
        
        if (valueType === 'config') {
            const configKey = `config::${idOrKey}`;
            const value = context[configKey];
             return (value && typeof value === 'object' && 'value' in value) ? value.value : undefined;
        }
        
        const sourceElement = allElements.find(el => 'id' in el && el.id === condition.sourceElementId) as FormElementInstance;
        const sourceState = condition.sourceElementId ? context[condition.sourceElementId] : undefined;

        if (type === 'source' && condition.sourcePropertyKey && sourceState?.fullObject) {
            return getNestedValue(sourceState.fullObject, condition.sourcePropertyKey);
        }

        // For context from table rows, keys are direct properties (the element IDs of the columns)
        if(context.hasOwnProperty(idOrKey)) {
            const value = context[idOrKey];
            // The value in a row context might not be wrapped in a {value: ...} object
             return (typeof value === 'object' && value !== null && 'value' in value) ? value.value : value;
        }

        // For global formState context, keys are element IDs
        const element = allElements.find(el => 'id' in el && el.id === idOrKey);
        if (element && 'id' in element && context[element.id]) {
            const stateValue = context[element.id];
            return (typeof stateValue === 'object' && stateValue !== null && 'value' in stateValue) ? stateValue.value : stateValue;
        }
        
        return undefined;
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
    } else if (condition.comparisonType === 'date' || condition.comparisonType === 'status') {
        comparisonValue = getConditionValue('comparison', condition.value);
    } else { // 'value'
        comparisonValue = condition.value;
    }

    const isComparisonValueEmpty = comparisonValue === undefined || comparisonValue === null || comparisonValue === "";

    const isNumericComparison = ['is_greater_than', 'is_less_than', 'is_greater_than_or_equal_to', 'is_less_than_or_equal_to'].includes(condition.operator);
    
    if (isNumericComparison) {
        let numSource = parseFloat(sourceValue);
        const numComparison = parseFloat(comparisonValue);

        if (condition.offsetValue) {
            numSource += condition.offsetValue;
        }

        if (isNaN(numSource) || isNaN(numComparison)) {
            return false;
        }
        if (condition.operator === 'is_greater_than') return numSource > numComparison;
        if (condition.operator === 'is_less_than') return numSource < numComparison;
        if (condition.operator === 'is_greater_than_or_equal_to') return numSource >= numComparison;
        if (condition.operator === 'is_less_than_or_equal_to') return numSource <= numComparison;
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
                case 'is_greater_than_or_equal_to': return dateSource >= dateComparison;
                case 'is_less_than_or_equal_to': return dateSource <= dateComparison;
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

export const evaluateRule = (rule: Rule | Workflow, context: { [key: string]: any }, configurations?: Configuration[], sections?: Section[]): boolean => {
  if (!rule || !rule.conditions || rule.conditions.length === 0 || !context) {
    return false;
  }

  const allElements = sections ? getAllElements(sections) : [];

  // Evaluate all conditions against the provided context.
  const conditionResults = rule.conditions.map((cond) =>
    evaluateSingleCondition(cond, context, allElements, configurations)
  );

  if (rule.logicType === 'and') {
    return conditionResults.every((res) => res);
  } else {
    // 'or'
    return conditionResults.some((res) => res);
  }
};
