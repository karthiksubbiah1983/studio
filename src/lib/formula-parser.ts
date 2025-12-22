

// A very simple, not-so-safe formula evaluator.
// Supports basic arithmetic operations and variable substitution from a context object.
// Variables in the formula should be enclosed in curly braces, e.g., {varName}.

export function evaluate(formula: string, context: Record<string, any>): number | string {
  if (!formula) return '';
  try {
    // Replace {key} with context[key]
    const sanitizedFormula = formula.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, key) => {
      // In a table row context, the `context` object's keys might be element IDs,
      // but the formula uses the element's `key` property. We need to find the element
      // with the matching `key` and then get its value from the context using its ID.
      const elementId = Object.keys(context).find(id => context[id] && context[id].key === key);
      
      let value = context[key]; // Direct match for fields outside tables

      if (elementId && context[elementId]) {
         value = context[elementId]; // Use value from table row context by element ID
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
