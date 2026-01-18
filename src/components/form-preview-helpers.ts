

import { FormElementInstance, Section, Rule, Condition, Configuration } from "@/lib/types";
import { Workflow } from "@/lib/types";
import { findElementRecursive, getAllElements, getNestedValue } from "@/lib/utils";

const isDateRelated = (element: FormElementInstance | Section | null) => {
    if (!element) return false;
    if ('type' in element) return element.type === 'DatePicker';
    return false;
};

export const evaluateSingleCondition = (condition: Condition, context: { [key: string]: any }, allElements: (FormElementInstance | Section)[], configurations?: Configuration[]) => {
    if (!context) return false;

    const getConditionValue = (valueType: ConditionSourceType | ConditionComparisonType, idOrKey: string | undefined): any => {
        if (!idOrKey) return undefined;
        
        if (idOrKey.startsWith('_')) {
            switch(idOrKey) {
                case '_current_date': return new Date().toISOString(); 
                case '_due_date': return new Date().toISOString(); 
                case '_scheduled_date': return new Date().toISOString();
                default: return undefined;
            }
        }
        
        if (valueType === 'config') {
            const configKey = `config::${idOrKey}`;
            const value = context[configKey];
            return (value && typeof value === 'object' && 'value' in value) ? value.value : undefined;
        }
        
        if (valueType === 'field') {
            const element = allElements.find(el => 'id' in el && el.id === idOrKey) as FormElementInstance | undefined;
            if (!element) return undefined;

            let value;
            // Case 1: Context is a row object (keys are data keys from element.key)
            if (element.key && context.hasOwnProperty(element.key)) {
                value = context[element.key];
            } 
            // Case 2: Context is the global formState (keys are element IDs)
            else if (context.hasOwnProperty(element.id)) {
                value = context[element.id];
            } else {
                return undefined;
            }
            
            // The value might be a raw value (in a row context) or a state object { value: ... }
            return (value && typeof value === 'object' && 'value' in value) ? value.value : value;
        }
        
        // For comparisonType 'value', 'date', 'status'
        return idOrKey;
    }

    let sourceValue: any;
    if (condition.sourceType === 'field') {
        sourceValue = getConditionValue(condition.sourceType, condition.sourceElementId);
    } else { // 'date', 'status', 'config'
        sourceValue = getConditionValue(condition.sourceType, condition.sourceValue);
    }
    
    if (condition.sourceType === 'field' && condition.sourcePropertyKey && sourceValue && typeof sourceValue === 'object') {
        sourceValue = getNestedValue(sourceValue, condition.sourcePropertyKey);
    }

    const isSourceValueEmpty = sourceValue === undefined || sourceValue === null || sourceValue === "";

    let comparisonValue: any;
    if (condition.comparisonType === 'field') {
        comparisonValue = getConditionValue(condition.comparisonType, condition.comparisonElementId);
    } else { // 'value', 'date', 'status', 'config'
        comparisonValue = getConditionValue(condition.comparisonType, condition.value);
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

    const sourceElement = allElements.find(el => 'id' in el && el.id === condition.sourceElementId) as FormElementInstance | undefined;
    const comparisonElement = allElements.find(el => 'id' in el && el.id === condition.comparisonElementId) as FormElementInstance | undefined;
    const isDateComparison = condition.sourceType === 'date' || condition.comparisonType === 'date' || isDateRelated(sourceElement) || isDateRelated(comparisonElement);


    if (isDateComparison) {
        try {
            let dateSource = new Date(sourceValue);
            let dateComparison = new Date(comparisonValue);

            if (isNaN(dateSource.getTime()) || isNaN(dateComparison.getTime())) return false;

            if (!condition.includeTime) {
                dateSource.setHours(0, 0, 0, 0);
                dateComparison.setHours(0, 0, 0, 0);
            }

            if (condition.offsetDays) {
                dateSource.setDate(dateSource.getDate() + condition.offsetDays);
            }
             if (condition.includeTime && condition.offsetHours) {
                dateSource.setHours(dateSource.getHours() + condition.offsetHours);
            }
            if (condition.includeTime && condition.offsetMinutes) {
                dateSource.setMinutes(dateSource.getMinutes() + condition.offsetMinutes);
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
