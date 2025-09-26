
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

export const SuggestFormElementsInputSchema = z.object({
  context: z.string().describe('The context or title of the form section to get element suggestions for.'),
});
export type SuggestFormElementsInput = z.infer<typeof SuggestFormElementsInputSchema>;

const ElementSuggestionSchema = z.object({
  type: z.string().describe('The type of the form element to suggest, e.g., "Input", "Select", "Checkbox".'),
  label: z.string().describe('The proposed label for the form element.'),
  reason: z.string().describe('A brief justification for why this element is a good suggestion.'),
});

export const SuggestFormElementsOutputSchema = z.object({
  suggestions: z.array(ElementSuggestionSchema).describe('A list of suggested form elements.'),
});
export type SuggestFormElementsOutput = z.infer<typeof SuggestFormElementsOutputSchema>;


export const suggestFormElementsFlow = ai.defineFlow(
  {
    name: 'suggestFormElementsFlow',
    inputSchema: SuggestFormElementsInputSchema,
    outputSchema: SuggestFormElementsOutputSchema,
  },
  async (input) => {
    const prompt = `Based on the following form context, suggest 3-5 relevant form elements.
    The context is: "${input.context}".
    Provide diverse and useful element types. For example, if the context is "Contact Information", you might suggest fields for name, email, phone, and a message.
    Return the suggestions in the specified JSON format.`;

    const llmResponse = await ai.generate({
      prompt: prompt,
      model: 'googleai/gemini-1.5-flash',
      output: {
        schema: SuggestFormElementsOutputSchema,
      },
    });

    return llmResponse.output || { suggestions: [] };
  }
);

export function registerFlows() {
    return [suggestFormElementsFlow];
}
