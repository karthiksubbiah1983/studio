
// A very simple, not-so-safe formula evaluator.
// Supports basic arithmetic operations and variable substitution from a context object.
// Variables in the formula should be enclosed in curly braces, e.g., {varName}.

export function evaluate(formula: string, context: Record<string, any>): number | string {
  try {
    // Replace {key} with context[key]
    const sanitizedFormula = formula.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, key) => {
      const value = context[key];
      // Ensure the value is a number, default to 0 if not.
      const numValue = parseFloat(value);
      return isNaN(numValue) ? '0' : String(numValue);
    });

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
