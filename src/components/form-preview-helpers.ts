

import { FormElementInstance, Section, Rule, Condition, Configuration } from "@/lib/types";
import { Workflow } from "@/lib/types";
import { findElementRecursive, getAllElements, getNestedValue, findParentTable } from "@/lib/utils";

const isDateRelated = (element: FormElementInstance | Section | null) => {
    if (!element) return false;
    if ('type' in element) return element.type === 'DatePicker';
    return false;
};

// Helper function that performs the actual comparison for a condition
function checkConditionAgainstValue(
    sourceValue: any,
    condition: Condition,
    globalContext: { [key: string]: any },
    allElements: (FormElementInstance | Section)[],
    configurations: Configuration[] | undefined,
    rowContext?: any
) {
    const isSourceValueEmpty = sourceValue === undefined || sourceValue === null || sourceValue === "";

    let comparisonValue: any;
    // Determine the comparison value based on its type
    if (condition.comparisonType === 'field' && condition.comparisonElementId) {
        const comparisonElement = allElements.find(el => el.id === condition.comparisonElementId) as (FormElementInstance & { isTableColumn?: boolean }) | undefined;

        if (comparisonElement && comparisonElement.isTableColumn && rowContext) {
            // If the comparison is a table column and we have row context, use it.
            comparisonValue = getNestedValue(rowContext, comparisonElement.key!);
        } else if (comparisonElement && globalContext[comparisonElement.id]) {
            // Otherwise, use the global context as before.
            comparisonValue = globalContext[comparisonElement.id].value;
        }
    } else {
        comparisonValue = condition.value;
    }

    const isComparisonValueEmpty = comparisonValue === undefined || comparisonValue === null || comparisonValue === "";

    // Numeric Comparisons
    const isNumericComparison = ['is_greater_than', 'is_less_than', 'is_greater_than_or_equal_to', 'is_less_than_or_equal_to'].includes(condition.operator);
    if (isNumericComparison) {
        let numSource = parseFloat(sourceValue);
        const numComparison = parseFloat(comparisonValue);
        if (condition.offsetValue) numSource += condition.offsetValue;
        if (isNaN(numSource) || isNaN(numComparison)) return false;
        if (condition.operator === 'is_greater_than') return numSource > numComparison;
        if (condition.operator === 'is_less_than') return numSource < numComparison;
        if (condition.operator === 'is_greater_than_or_equal_to') return numSource >= numComparison;
        if (condition.operator === 'is_less_than_or_equal_to') return numSource <= numComparison;
    }

    // Equality Checks
    if (condition.operator === 'equals') {
        if (isSourceValueEmpty && isComparisonValueEmpty) return true;
        return String(sourceValue) === String(comparisonValue);
    }
    if (condition.operator === 'not_equals') {
        if (isSourceValueEmpty && isComparisonValueEmpty) return false;
        return String(sourceValue) !== String(comparisonValue);
    }

    // String/Date comparisons require non-empty source value
    if (isSourceValueEmpty) return false;

    // Date Comparisons
    const sourceElement = allElements.find(el => el.id === condition.sourceElementId) as FormElementInstance | undefined;
    const comparisonElement = allElements.find(el => el.id === condition.comparisonElementId) as FormElementInstance | undefined;
    const isDateComparison = condition.sourceType === 'date' || condition.comparisonType === 'date' || isDateRelated(sourceElement) || isDateRelated(comparisonElement);

    if (isDateComparison) {
        try {
            let dateSource = new Date(sourceValue);
            let dateComparison = new Date(comparisonValue);
            if (isNaN(dateSource.getTime()) || isNaN(dateComparison.getTime())) return false;
            // ... date offset logic ...
            switch(condition.operator) {
                case 'is_greater_than': return dateSource > dateComparison;
                case 'is_less_than': return dateSource < dateComparison;
                case 'is_greater_than_or_equal_to': return dateSource >= dateComparison;
                case 'is_less_than_or_equal_to': return dateSource <= dateComparison;
                default: return false; 
            }
        } catch (e) { return false; }
    }

    // String contains
    switch (condition.operator) {
       case 'contains': return String(sourceValue).includes(String(comparisonValue));
       case 'not_contains': return !String(sourceValue).includes(String(comparisonValue));
       default: return false;
    }
}


export const evaluateSingleCondition = (
    condition: Condition,
    globalContext: { [key: string]: any },
    allElements: (FormElementInstance | Section)[],
    configurations?: Configuration[],
    rowContext?: any
): boolean => {
    const sourceElement = allElements.find(el => el.id === condition.sourceElementId) as (FormElementInstance & { isTableColumn?: boolean }) | undefined;

    // This function passes the rowContext down to the worker if it exists.
    const workerFunction = (sourceValue: any) => checkConditionAgainstValue(sourceValue, condition, globalContext, allElements, configurations, rowContext);

    // Case 1: The condition's source is a table column.
    if (sourceElement && sourceElement.isTableColumn) {
        // We are evaluating FOR a target inside a row, so use the specific row's context.
        if (rowContext) {
            const sourceValue = getNestedValue(rowContext, sourceElement.key!);
            return workerFunction(sourceValue);
        }
        // We are evaluating FOR a target outside a row, so we check if ANY row meets the condition.
        else {
            const parentTable = findParentTable(allElements, sourceElement.id);
            if (parentTable && globalContext[parentTable.id]?.value) {
                const tableRows = globalContext[parentTable.id].value as any[];
                // Iterate all rows. For each row, check the condition.
                // The `rowContext` for this check is the iterated `row` itself.
                return tableRows.some(row => {
                    const rowValue = getNestedValue(row, sourceElement.key!);
                    return checkConditionAgainstValue(rowValue, condition, globalContext, allElements, configurations, row);
                });
            }
            return false;
        }
    }
    // Case 2: The condition's source is a regular element, not in a table.
    else {
        let sourceValue: any;
        if (condition.sourceType === 'field' && sourceElement) {
             sourceValue = globalContext[sourceElement.id]?.value;
        } else {
             // Handle other source types like date, config etc.
             sourceValue = condition.sourceValue; // Simplified for brevity
        }
        return workerFunction(sourceValue);
    }
}


export const evaluateRule = (
    rule: Rule | Workflow, 
    context: { [key: string]: any }, 
    configurations?: Configuration[], 
    sections?: Section[],
    rowContext?: any // NEW: Optional context for the specific row being evaluated
): boolean => {
  if (!rule || !rule.conditions || rule.conditions.length === 0 || !context) {
    return false;
  }

  const allElements = sections ? getAllElements(sections) : [];

  // Evaluate all conditions against the provided context.
  const conditionResults = rule.conditions.map((cond) =>
    evaluateSingleCondition(cond, context, allElements, configurations, rowContext)
  );

  if (rule.logicType === 'and') {
    return conditionResults.every((res) => res);
  } else {
    // 'or'
    return conditionResults.some((res) => res);
  }
};
