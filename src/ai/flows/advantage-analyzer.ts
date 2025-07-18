'use server';

/**
 * @fileOverview Analyzes the real-time score differential and scoring rates between the two teams and provides handicap suggestions.
 *
 * - analyzeAdvantage - A function that handles the advantage analysis process.
 * - AdvantageAnalyzerInput - The input type for the analyzeAdvantage function.
 * - AdvantageAnalyzerOutput - The return type for the analyzeAdvantage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AdvantageAnalyzerInputSchema = z.object({
  redScore: z.number().describe('The current score of the red team.'),
  blueScore: z.number().describe('The current score of the blue team.'),
  redScoringRate: z
    .number()
    .describe(
      'The average scoring rate of the red team (points per minute).' + 
      'If the match has just begun, use a default scoring rate of 1.0.'
    ),
  blueScoringRate: z
    .number()
    .describe(
      'The average scoring rate of the blue team (points per minute).' + 
      'If the match has just begun, use a default scoring rate of 1.0.'
    ),
  timeRemainingSeconds: z
    .number()
    .describe(
      'The remaining time in the match, in seconds.'
    )
});
export type AdvantageAnalyzerInput = z.infer<typeof AdvantageAnalyzerInputSchema>;

const AdvantageAnalyzerOutputSchema = z.object({
  advantageTeam: z
    .string() 
    .describe("Which team has a significant advantage. Either 'red', 'blue', or 'none'."),
  handicapRecommendation: z.string().describe(
    'A recommendation for a handicap to apply to the leading team, to make the match more fair and exciting.' +
    'If there is no significant advantage, this should be an empty string.'
  ),
});
export type AdvantageAnalyzerOutput = z.infer<typeof AdvantageAnalyzerOutputSchema>;

export async function analyzeAdvantage(input: AdvantageAnalyzerInput): Promise<AdvantageAnalyzerOutput> {
  return analyzeAdvantageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'advantageAnalyzerPrompt',
  input: {schema: AdvantageAnalyzerInputSchema},
  output: {schema: AdvantageAnalyzerOutputSchema},
  prompt: `You are an AI assistant that analyzes the current state of a Taekwondo (TKD) match and suggests handicaps for the leading team if one team has a significant advantage.

  Here's the current match state:
  - Red Team Score: {{{redScore}}}
  - Blue Team Score: {{{blueScore}}}
  - Red Team Scoring Rate: {{{redScoringRate}}} points per minute
  - Blue Team Scoring Rate: {{{blueScoringRate}}} points per minute
  - Time Remaining: {{{timeRemainingSeconds}}} seconds

  Analyze the match to determine if one team has a significant advantage, considering both the score difference and the scoring rates.

  Significant advantage:
  - A score difference of 10 points or more with little time remaining.
  - A scoring rate significantly higher for one team, indicating a strong likelihood of maintaining or increasing the lead.

  If a significant advantage is detected, recommend a handicap for the leading team.  The handicaps should be relevant to the current state of the game. For example:
  - Limiting the leading team to only scoring with body shots, which are worth fewer points.
  - Requiring the leading team to score more points for each technique, such as requiring 3 points for a technique that normally scores 2.
  - Disallowing the leading team from using certain scoring techniques.

  If neither team has a significant advantage, respond with advantageTeam: "none", and an empty string for handicapRecommendation.

  Ensure that the response can be parsed as valid JSON matching the schema.
`,
});

const analyzeAdvantageFlow = ai.defineFlow(
  {
    name: 'analyzeAdvantageFlow',
    inputSchema: AdvantageAnalyzerInputSchema,
    outputSchema: AdvantageAnalyzerOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
