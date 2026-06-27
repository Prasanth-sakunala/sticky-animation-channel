import { generateContent } from '../services/gemini.js';
import type { QualityScore } from '../types.js';

export async function scoreScript(script: string): Promise<QualityScore> {
  const prompt = `You are a YouTube content quality evaluator. Score this narration script on a scale of 1-10 for each criterion.

SCRIPT:
"""
${script}
"""

Score on:
1. hook_strength: Does the first line grab attention immediately?
2. pacing: Does tension build steadily throughout?
3. payoff: Is the ending satisfying and memorable?
4. speakability: Does it flow naturally when spoken aloud?
5. retention_hooks: Are there micro-hooks every 30 seconds to prevent drop-off?

Respond in this exact JSON format:
{
  "hook_strength": <number 1-10>,
  "pacing": <number 1-10>,
  "payoff": <number 1-10>,
  "speakability": <number 1-10>,
  "retention_hooks": <number 1-10>,
  "feedback": "<specific improvement suggestions if average < 7, otherwise empty string>"
}`;

  const response = await generateContent(prompt, 0.3);
  const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const scores = JSON.parse(cleaned);

  const average = (
    scores.hook_strength +
    scores.pacing +
    scores.payoff +
    scores.speakability +
    scores.retention_hooks
  ) / 5;

  return {
    ...scores,
    average: Math.round(average * 10) / 10,
    approved: average >= 7,
  };
}
