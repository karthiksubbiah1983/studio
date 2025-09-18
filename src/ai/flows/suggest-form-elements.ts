'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting relevant form elements and layout optimizations based on the content of a given section.
 *
 * - suggestFormElements - The main function to trigger the form element suggestion flow.
 * - SuggestFormElementsInput - The input type for the suggestFormElements function.
 * - SuggestFormElementsOutput - The output type for the suggestFormElements function, providing a list of suggested elements.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestFormElementsInputSchema = z.object({
  sectionTitle: z
    .string()
    .describe('The title of the section for which to suggest form elements.'),
  existingContent: z
    .string()
    .optional()
    .describe(
      'Optional existing content within the section to further refine suggestions.'
    ),
});
export type SuggestFormElementsInput = z.infer<
  typeof SuggestFormElementsInputSchema
>;

const SuggestFormElementsOutputSchema = z.object({
  suggestedElements: z
    .array(z.string())
    .describe('An array of suggested form element types (e.g., text, email, dropdown).'),
  layoutOptimizations: z
    .array(z.string())
    .optional()
    .describe(
      'Optional suggestions for layout optimizations (e.g., use of columns, field groupings).' // Corrected typo here
    ),
});
export type SuggestFormElementsOutput = z.infer<
  typeof SuggestFormElementsOutputSchema
>;

export async function suggestFormElements(
  input: SuggestFormElementsInput
): Promise<SuggestFormElementsOutput> {
  return suggestFormElementsFlow(input);
}

const suggestFormElementsPrompt = ai.definePrompt({
  name: 'suggestFormElementsPrompt',
  input: {schema: SuggestFormElementsInputSchema},
  output: {schema: SuggestFormElementsOutputSchema},
  prompt: `You are an AI assistant designed to suggest form elements and layout optimizations for a form builder application.

  Based on the section title and existing content (if any), suggest relevant form elements and layout optimizations.

  Section Title: {{{sectionTitle}}}
  Existing Content: {{{existingContent}}}

  Consider common form element types like text fields, email fields, dropdowns, checkboxes, and date pickers.
  Also, suggest layout optimizations such as using multiple columns or grouping related fields together.

  Format your response as a JSON object with "suggestedElements" and "layoutOptimizations" fields. suggestedElements should be an array of form element types, and layoutOptimizations should be an array of layout suggestions, when appropriate.
`,
});

const suggestFormElementsFlow = ai.defineFlow(
  {
    name: 'suggestFormElementsFlow',
    inputSchema: SuggestFormElementsInputSchema,
    outputSchema: SuggestFormElementsOutputSchema,
  },
  async input => {
    const {output} = await suggestFormElementsPrompt(input);
    return output!;
  }
);
