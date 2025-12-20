
import { FormElementInstance, Section, Rule, Condition, Configuration } from "@/lib/types";
import { Workflow } from "@/lib/types";
import { getAllElements, getNestedValue, findElementRecursive } from "@/lib/utils";

export const evaluateSingleCondition = (condition: Condition, context: { [key: string]: any }, allElements: (FormElementInstance | Section)[], configurations?: Configuration[]) => {
    
    const getConditionValue = (type: 'source' | 'comparison', idOrKey: string | undefined): any => {
        if (!idOrKey) return undefined;
        
        const valueType = type === 'source' ? condition.sourceType : condition.comparisonType;

        if (idOrKey.startsWith('_')) { // Handle special date values
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

        if (context) {
            const isProxyId = idOrKey.includes('::');
            
            // For row context, the key might be direct
            const directKey = isProxyId ? idOrKey.split('::')[1] : idOrKey;
            
            if (context[directKey] !== undefined) {
                 const val = context[directKey];
                 if (typeof val === 'object' && val !== null && 'value' in val) return val.value;
                 return val;
            }
            
            // Find element by ID or Key in the full element list
            const element = allElements.find(el => ('id' in el && el.id === idOrKey) || ('key' in el && el.key === idOrKey));
            
            if (element) {
                // If context is the full formState, it will be keyed by element ID
                if ('id' in element && context[element.id] !== undefined) {
                    const val = context[element.id];
                    if (typeof val === 'object' && val !== null && 'value' in val) return val.value;
                    return val;
                }
                // If context is a row, it might be keyed by the element key
                if ('key' in element && context[element.key] !== undefined) {
                    const val = context[element.key];
                    if (typeof val === 'object' && val !== null && 'value' in val) return val.value;
                    return val;
                }
            }
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
