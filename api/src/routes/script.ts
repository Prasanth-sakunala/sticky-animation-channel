import { Router } from 'express';
import { generateContent } from '../services/gemini.js';
import { scoreScript } from '../utils/quality-gate.js';
import type { ScriptResult } from '../types.js';

export const scriptRouter = Router();

// POST /api/script — generate narration script
scriptRouter.post('/', async (req, res) => {
  try {
    const { topic, angle, category } = req.body;
    if (!topic) {
      return res.status(400).json({ error: 'topic required in body' });
    }

    const prompt = `You are a YouTube storytelling scriptwriter optimized for AI text-to-speech (Kokoro TTS).

Topic: ${topic}
Angle: ${angle || 'Tell the most interesting version of this story'}
Category: ${category || 'mystery'}

Structure:
1. HOOK (first 10 seconds) — question or shocking statement that makes viewers stay
2. SETUP — introduce the story context (who, where, when)
3. PROGRESSION — build tension scene by scene
4. TWIST/REVEAL — the surprising element
5. ENDING — satisfying conclusion + open question for comments

TTS Punctuation Rules (CRITICAL — these control voice cadence):
- Use "..." (ellipsis) to create dramatic trailing pauses: "They thought... they were safe."
- Use "—" (em-dash) for sudden hard stops that create tension: "The door wasn't locked from inside—it was welded shut."
- Use "!" at the end of SHORT sentences for intensity (never on long ones)
- Use lowercase + tight punctuation for tense/quiet moments
- NEVER write flat comma-separated lists. Break them into punchy fragments.

Writing Style:
- Write ONLY the narration (no stage directions, no scene notes)
- Write for SPOKEN narration — punchy, conversational, never academic
- Max 12 words per sentence. Shorter = more dramatic
- Every sentence should have rhythm — alternate short bursts with trailing ellipsis pauses
- Start with the most shocking/intriguing part of the story
- Target 700-1000 words (3-5 min at narration speed)
- Every 30 seconds must have a micro-hook to prevent drop-off
- End with a question that invites comments

Example of CORRECT cadence:
"They thought... they were completely safe... inside the bunker. They... were wrong. Because the door wasn't locked from the inside—it was welded shut... from the outside!"

Example of WRONG cadence (too flat):
"They thought they were completely safe inside the bunker. They were wrong. Because the door wasn't locked from the inside, it was welded shut from the outside."`;

    const script = await generateContent(prompt, 0.9);
    const wordCount = script.split(/\s+/).length;
    const estimatedDuration = Math.round(wordCount / 2.5);

    const result: ScriptResult = {
      script,
      word_count: wordCount,
      estimated_duration_sec: estimatedDuration,
    };

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/script/with-quality-gate — generate + score + retry
scriptRouter.post('/with-quality-gate', async (req, res) => {
  try {
    const { topic, angle, category, maxRetries = 2 } = req.body;
    if (!topic) {
      return res.status(400).json({ error: 'topic required in body' });
    }

    let currentScript = '';
    let score;
    let attempt = 0;

    while (attempt <= maxRetries) {
      // Generate script
      const genPrompt = attempt === 0
        ? `You are a YouTube storytelling scriptwriter optimized for AI text-to-speech (Kokoro TTS).

Topic: ${topic}
Angle: ${angle || 'Tell the most interesting version of this story'}
Category: ${category || 'mystery'}

Structure:
1. HOOK (first 10 seconds) — question or shocking statement
2. SETUP — introduce the story context
3. PROGRESSION — build tension scene by scene
4. TWIST/REVEAL — the surprising element
5. ENDING — satisfying conclusion + open question for comments

TTS Punctuation Rules (CRITICAL):
- "..." (ellipsis) = trailing dramatic pause
- "—" (em-dash) = hard sudden break creating tension
- "!" on short sentences = intensity burst
- Max 12 words per sentence. Shorter = more dramatic
- Every sentence has rhythm: alternate short bursts with trailing pauses
- Never write flat, comma-heavy prose

Example: "They thought... they were safe. They were wrong—dead wrong... and no one... was coming to help!"

Rules: Write ONLY narration text. Target 700-1000 words. Micro-hook every 30 sec.`
        : `Rewrite this YouTube narration script with these improvements:

FEEDBACK: ${score?.feedback}

ORIGINAL SCRIPT:
${currentScript}

Rules: Keep 700-1000 words, conversational, short sentences, micro-hooks every 30 sec.`;

      currentScript = await generateContent(genPrompt, 0.9);

      // Score it
      score = await scoreScript(currentScript);

      if (score.approved) {
        const wordCount = currentScript.split(/\s+/).length;
        return res.json({
          script: currentScript,
          word_count: wordCount,
          estimated_duration_sec: Math.round(wordCount / 2.5),
          quality_score: score,
          attempts: attempt + 1,
        });
      }

      attempt++;
    }

    // Failed after retries
    res.status(422).json({
      error: 'Script did not pass quality gate after retries',
      last_score: score,
      last_script: currentScript,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
