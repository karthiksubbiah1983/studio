

import { FormElementInstance } from "./types";

// A very simple, not-so-safe formula evaluator.
// Supports basic arithmetic operations and variable substitution from a context object.
// Variables in the formula should be enclosed in curly braces, e.g., {varName}.

export function evaluate(formula: string, context: Record<string, any>, allElements: FormElementInstance[]): number | string {
  if (!formula) return '';
  try {
    // Replace {key} with context[key]
    const sanitizedFormula = formula.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, key) => {
      // Find the element with the matching `key`
      const element = allElements.find(el => el.key === key);
      let value: any;

      if (element) {
        // If the element ID exists as a key in the current context (e.g., a table row)
        if (context.hasOwnProperty(element.id)) {
            value = context[element.id];
        } else if (context[element.id]) {
            // Fallback to the main form state if not in row context
             value = context[element.id]?.value;
        }
      }
      
      // Ensure the value is a number or 0 if not present/valid
      const numValue = parseFloat(value);
      return isNaN(numValue) ? '0' : String(numValue);
    });

    // Basic validation to prevent arbitrary code execution
    if (/[^0-9.+\-*/\s()]/.test(sanitizedFormula)) {
      console.error("Invalid characters in formula:", sanitizedFormula);
      return "#FORMULA!";
    }

    // Create a new Function to evaluate the sanitized string.
    // This is safer than a direct eval() because it runs in a local scope.
    // WARNING: This is still not perfectly safe for untrusted user input on a server,
    // but it's acceptable for this client-side form-builder context.
    const result = new Function(`return ${sanitizedFormula}`)();

    if (typeof result !== 'number' || !isFinite(result)) {
        return "#VALUE!";
    }

    return result;
  } catch (error) {
    console.error("Formula evaluation error:", error);
    return "#ERROR!";
  }
}
