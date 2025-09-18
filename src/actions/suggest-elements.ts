"use server";

import { suggestFormElements, SuggestFormElementsInput, SuggestFormElementsOutput } from "@/ai/flows/suggest-form-elements";

export async function suggestElementsAction(
  input: SuggestFormElementsInput
): Promise<SuggestFormElementsOutput> {
  try {
    const suggestions = await suggestFormElements(input);
    return suggestions;
  } catch (error) {
    console.error("Error in suggestElementsAction:", error);
    throw new Error("Failed to get AI suggestions.");
  }
}
