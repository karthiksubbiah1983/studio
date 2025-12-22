

import { FormElementInstance } from "./types";

// A very simple, not-so-safe formula evaluator.
// Supports basic arithmetic operations and variable substitution from a context object.
// Variables in the formula should be enclosed in curly braces, e.g., {varName}.

export function evaluate(formula: string, context: Record<string, any>, allElements: FormElementInstance[]): number | string {
  if (!formula) return '';
  try {
    // 1. Replace variables like {key} with their numeric values from the context
    let processedFormula = formula.replace(/\{([a-zA-Z0-9_.]+)\}/g, (match, key) => {
      const element = allElements.find(el => el.key === key);
      let value: any;
      
      const contextToUse = context;

      if (element) {
        if (contextToUse && contextToUse.hasOwnProperty(element.id)) {
            const stateValue = contextToUse[element.id];
            value = (typeof stateValue === 'object' && stateValue !== null && 'value' in stateValue) ? stateValue.value : stateValue;
        } else if (contextToUse && contextToUse[element.id]) {
             const stateValue = contextToUse[element.id];
             value = (typeof stateValue === 'object' && stateValue !== null && 'value' in stateValue) ? stateValue.value : stateValue;
        }
      }
      
      // Intelligent value conversion
      if (typeof value === 'string' && value.includes('%')) {
        const num = parseFloat(value.replace('%', ''));
        return isNaN(num) ? '0' : `(${num / 100})`;
      }

      const numValue = parseFloat(value);
      return isNaN(numValue) ? '0' : String(numValue);
    });
    
    // 2. Handle percentage literals in the formula itself (e.g., "10%")
    processedFormula = processedFormula.replace(/(\d+(\.\d+)?)%/g, (match, number) => {
        return `(${parseFloat(number) / 100})`;
    });


    // 3. Basic validation to prevent arbitrary code execution
    // Allows numbers, arithmetic operators, parentheses, whitespace.
    if (/[^0-9.+\-*/\s().]/.test(processedFormula)) {
      console.error("Invalid characters in formula:", processedFormula);
      return "#FORMULA!";
    }

    // 4. Create a new Function to evaluate the sanitized string.
    const result = new Function(`return ${processedFormula}`)();

    if (typeof result !== 'number' || !isFinite(result)) {
        return "#VALUE!";
    }

    return result;
  } catch (error) {
    console.error("Formula evaluation error:", error);
    return "#ERROR!";
  }
}
