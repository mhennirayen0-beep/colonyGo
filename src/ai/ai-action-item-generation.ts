'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating action items from meeting notes.
 *
 * The flow takes meeting notes as input and returns a list of action items with descriptions.
 * - generateActionItems - A function that handles the action item generation process.
 * - GenerateActionItemsInput - The input type for the generateActionItems function.
 * - GenerateActionItemsOutput - The return type for the generateActionItems function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateActionItemsInputSchema = z.object({
  meetingNotes: z
    .string()
    .describe('The notes from the meeting to generate action items from.'),
});
export type GenerateActionItemsInput = z.infer<typeof GenerateActionItemsInputSchema>;

const GenerateActionItemsOutputSchema = z.array(z.object({
  description: z.string().describe('The description of the action item.'),
}));
export type GenerateActionItemsOutput = z.infer<typeof GenerateActionItemsOutputSchema>;

export async function generateActionItems(input: GenerateActionItemsInput): Promise<GenerateActionItemsOutput> {
  return generateActionItemsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateActionItemsPrompt',
  input: {schema: GenerateActionItemsInputSchema},
  output: {schema: GenerateActionItemsOutputSchema},
  prompt: `You are an AI assistant helping sales representatives generate action items from meeting notes.\n\n  Based on the following meeting notes, generate a list of action items that the sales representative needs to take.\n\n  Meeting Notes: {{{meetingNotes}}}\n\n  Action Items:`,
});

const generateActionItemsFlow = ai.defineFlow(
  {
    name: 'generateActionItemsFlow',
    inputSchema: GenerateActionItemsInputSchema,
    outputSchema: GenerateActionItemsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
