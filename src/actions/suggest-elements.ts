
'use server';

import { suggestFormElementsFlow, SuggestFormElementsInput } from "@/ai/flows/suggest-form-elements";

export async function suggestElements(
  input: SuggestFormElementsInput
) {
  return await suggestFormElementsFlow(input);
}
