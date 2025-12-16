// This is an AI-powered sales alert system.
//
// - getSalesAlert - A function that generates sales alerts for sales managers.
// - SalesAlertInput - The input type for the getSalesAlert function.
// - SalesAlertOutput - The return type for the getSalesAlert function.

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SalesAlertInputSchema = z.object({
  opportunityDetails: z
    .string()
    .describe('Details of the sales opportunity, including client, product, sales stage, and expected close date.'),
  actionTracking: z
    .string()
    .describe('Information on actions related to the opportunity, including status and due dates.'),
  newsFeed: z.string().describe('Recent updates on the opportunity, such as changes in status, new quotes, and notes.'),
});
export type SalesAlertInput = z.infer<typeof SalesAlertInputSchema>;

const SalesAlertOutputSchema = z.object({
  alertType: z
    .string()
    .describe(
      'The type of alert, such as delay, anomaly, or risk.  Choose from: DELAY, ANOMALY, RISK.  If no alert is needed, return NONE.'
    ),
  alertMessage: z
    .string()
    .describe('A detailed description of the alert, including the potential issue and recommended actions.'),
});
export type SalesAlertOutput = z.infer<typeof SalesAlertOutputSchema>;

export async function getSalesAlert(input: SalesAlertInput): Promise<SalesAlertOutput> {
  return getSalesAlertFlow(input);
}

const prompt = ai.definePrompt({
  name: 'salesAlertPrompt',
  input: {schema: SalesAlertInputSchema},
  output: {schema: SalesAlertOutputSchema},
  prompt: `You are an AI assistant that analyzes sales opportunities and generates alerts for sales managers.

  Based on the provided opportunity details, action tracking, and news feed, identify any potential issues such as delays, anomalies, or risks.
  If there is a potential issue, generate an alert message with a detailed description of the issue and recommended actions. If everything looks good, return alertType of NONE.

  Opportunity Details: {{{opportunityDetails}}}
  Action Tracking: {{{actionTracking}}}
  News Feed: {{{newsFeed}}}`,
});

const getSalesAlertFlow = ai.defineFlow(
  {
    name: 'getSalesAlertFlow',
    inputSchema: SalesAlertInputSchema,
    outputSchema: SalesAlertOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
