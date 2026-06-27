import { generateJSON } from './gemini.js';

/**
 * Hook Generator — creates compelling opening hooks for YouTube videos.
 * Uses pattern library + AI to generate A/B variants with retention scoring.
 */

export interface HookVariant {
  text: string;
  pattern: HookPattern;
  estimated_retention_score: number; // 0-10
  word_count: number;
  target_duration_sec: number;
}

export interface HookResult {
  variants: HookVariant[];
  selected: HookVariant;
  reasoning: string;
}

export type HookPattern =
  | 'question' // "What if I told you..."
  | 'impossible' // "This shouldn't be possible..."
  | 'countdown' // "In 30 seconds, everything changed..."
  | 'contrast' // "Everyone thought X... they were wrong."
  | 'mystery' // "Nobody knows why..."
  | 'revelation' // "I just discovered something..."
  | 'shock' // "This is the most [extreme] thing ever..."
  | 'stakes' // "If they failed, everyone would die."
  | 'timestamp' // "At 3:47 AM, the cameras caught..."
  | 'forbidden'; // "You were never supposed to see this."

// Pattern templates — proven high-retention openers
const PATTERN_DESCRIPTIONS: Record<HookPattern, string> = {
  question: 'Open with an impossible or intriguing question that demands an answer',
  impossible: 'Present something that defies logic/physics/expectations',
  countdown: 'Create urgency with a ticking clock or limited timeframe',
  contrast: 'Set up what everyone believes, then flip it dramatically',
  mystery: 'Introduce an unsolved enigma that the video will explore',
  revelation: 'Promise exclusive/new information the viewer hasn\'t heard',
  shock: 'Lead with the most extreme superlative claim (must be defensible)',
  stakes: 'Immediately establish life-or-death (or high) consequences',
  timestamp: 'Ground the story in a specific, eerie moment in time',
  forbidden: 'Imply the viewer is seeing something restricted or secret',
};

export async function generateHooks(
  topic: string,
  script: string,
  category: string = 'mystery',
  numVariants: number = 3
): Promise<HookResult> {
  const scriptPreview = script.slice(0, 500);

  const prompt = `You are a YouTube hook specialist. Your ONLY job is crafting opening lines that maximize first-5-second retention.

TOPIC: ${topic}
CATEGORY: ${category}
SCRIPT PREVIEW: "${scriptPreview}..."

HOOK PATTERNS (proven high-retention formats):
${Object.entries(PATTERN_DESCRIPTIONS).map(([k, v]) => `- ${k}: ${v}`).join('\n')}

Generate exactly ${numVariants} DIFFERENT hook variants. Each must:
1. Be 5-15 words maximum (2-4 seconds spoken)
2. Use a DIFFERENT pattern from the list above
3. Create an "open loop" the viewer MUST close by watching
4. Work with TTS punctuation (use "..." for pauses, "—" for hard stops)
5. NEVER reveal the answer/payoff — only tease it

CRITICAL RULES:
- First word must be attention-grabbing (never start with "So", "Well", "Today")
- Must create curiosity gap — viewer needs to know what happens next
- No clickbait that can't be delivered — the hook must relate to actual content
- Shorter = better. Under 10 words is ideal.

Also select the BEST variant and explain why in 1 sentence.

Score each variant's estimated_retention_score (1-10):
- 10 = viewer physically cannot scroll away
- 7 = strong interest, will watch at least 30 more seconds
- 5 = mild curiosity
- 3 = generic, easily ignored

Output JSON:
{
  "variants": [
    {
      "text": "hook text here...",
      "pattern": "pattern_name",
      "estimated_retention_score": 8,
      "word_count": 7,
      "target_duration_sec": 3
    }
  ],
  "selected_index": 0,
  "reasoning": "Why this hook wins"
}`;

  const result = await generateJSON<{
    variants: Array<{
      text: string;
      pattern: string;
      estimated_retention_score: number;
      word_count: number;
      target_duration_sec: number;
    }>;
    selected_index: number;
    reasoning: string;
  }>(prompt, 0.8);

  // Validate and clean
  const variants: HookVariant[] = result.variants.map((v) => ({
    text: v.text.trim(),
    pattern: validatePattern(v.pattern),
    estimated_retention_score: clamp(v.estimated_retention_score, 1, 10),
    word_count: v.text.trim().split(/\s+/).length,
    target_duration_sec: clamp(v.target_duration_sec, 1, 6),
  }));

  // Sort by score descending
  variants.sort((a, b) => b.estimated_retention_score - a.estimated_retention_score);

  const selectedIdx = clamp(result.selected_index || 0, 0, variants.length - 1);

  return {
    variants,
    selected: variants[selectedIdx],
    reasoning: result.reasoning || 'Highest retention score',
  };
}

/**
 * Replace the script's opening with the selected hook.
 * Ensures smooth transition from hook into the existing narrative.
 */
export function applyHookToScript(script: string, hook: HookVariant): string {
  const sentences = script.split(/(?<=[.!?…])\s+/);

  // Find how many opening sentences to replace (target ~first 5 seconds = ~12 words)
  let wordCount = 0;
  let replaceCount = 0;
  for (const sentence of sentences) {
    wordCount += sentence.split(/\s+/).length;
    replaceCount++;
    if (wordCount >= 12) break;
  }

  // Replace opening sentences with hook
  const remaining = sentences.slice(replaceCount).join(' ');
  return `${hook.text} ${remaining}`;
}

function validatePattern(p: string): HookPattern {
  const valid: HookPattern[] = [
    'question', 'impossible', 'countdown', 'contrast', 'mystery',
    'revelation', 'shock', 'stakes', 'timestamp', 'forbidden',
  ];
  if (valid.includes(p as HookPattern)) return p as HookPattern;
  return 'mystery';
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
