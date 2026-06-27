import { generateJSON } from './gemini.js';

/**
 * Emotion Classifier — analyzes narration text to tag emotions
 * per sentence with intensity curves and transition smoothing.
 */

export interface EmotionTag {
  text: string;
  primary_emotion: Emotion;
  secondary_emotion: Emotion | null;
  intensity: number; // 0.0 - 1.0
  arousal: number; // 0.0 (calm) - 1.0 (high energy)
  valence: number; // -1.0 (negative) - 1.0 (positive)
}

export interface EmotionArc {
  sentences: EmotionTag[];
  /** Overall emotional trajectory */
  arc_type: 'rising' | 'falling' | 'wave' | 'plateau' | 'spike';
  /** Peak emotional moment (sentence index) */
  climax_index: number;
  /** Suggested mood per scene segment */
  mood_curve: MoodSegment[];
}

export interface MoodSegment {
  start_sentence: number;
  end_sentence: number;
  mood: string;
  avg_intensity: number;
}

export type Emotion =
  | 'fear' | 'surprise' | 'curiosity' | 'tension' | 'dread'
  | 'excitement' | 'wonder' | 'sadness' | 'anger' | 'disgust'
  | 'relief' | 'joy' | 'suspense' | 'confusion' | 'determination'
  | 'neutral';

const VALID_EMOTIONS: Emotion[] = [
  'fear', 'surprise', 'curiosity', 'tension', 'dread',
  'excitement', 'wonder', 'sadness', 'anger', 'disgust',
  'relief', 'joy', 'suspense', 'confusion', 'determination', 'neutral',
];

// Map emotions to scene moods for the renderer
const EMOTION_TO_MOOD: Record<Emotion, string> = {
  fear: 'tense',
  surprise: 'dramatic',
  curiosity: 'mysterious',
  tension: 'tense',
  dread: 'eerie',
  excitement: 'upbeat',
  wonder: 'calm',
  sadness: 'melancholic',
  anger: 'dramatic',
  disgust: 'eerie',
  relief: 'calm',
  joy: 'upbeat',
  suspense: 'mysterious',
  confusion: 'mysterious',
  determination: 'triumphant',
  neutral: 'calm',
};

export function emotionToMood(emotion: Emotion): string {
  return EMOTION_TO_MOOD[emotion] || 'calm';
}

export async function classifyEmotions(script: string): Promise<EmotionArc> {
  // Split into sentences for analysis
  const sentences = splitSentences(script);

  const prompt = `You are an emotion analysis expert for storytelling narration. Analyze each sentence for its emotional content.

NARRATION (${sentences.length} sentences):
${sentences.map((s, i) => `[${i}] "${s}"`).join('\n')}

For EACH sentence, classify:
- primary_emotion: The dominant emotion being evoked in the LISTENER (not character)
- secondary_emotion: A subtle undertone emotion, or null
- intensity: How strongly this emotion hits (0.0 = barely noticeable, 1.0 = overwhelming)
- arousal: Energy level (0.0 = sleepy/calm, 1.0 = heart-racing/frantic)
- valence: Positive vs negative (-1.0 = deeply negative, 0.0 = neutral, 1.0 = elated)

VALID EMOTIONS: ${VALID_EMOTIONS.join(', ')}

Also identify:
- arc_type: The overall emotional trajectory of the script
  - "rising" = builds from calm to intense
  - "falling" = starts intense, resolves to calm
  - "wave" = alternating peaks and valleys
  - "plateau" = sustained intensity with brief dips
  - "spike" = one major emotional peak with buildup and resolution
- climax_index: Which sentence number is the emotional peak

Output JSON:
{
  "sentences": [
    {
      "text": "exact sentence text",
      "primary_emotion": "emotion",
      "secondary_emotion": "emotion or null",
      "intensity": 0.7,
      "arousal": 0.6,
      "valence": -0.3
    }
  ],
  "arc_type": "rising|falling|wave|plateau|spike",
  "climax_index": 12
}`;

  const result = await generateJSON<{
    sentences: EmotionTag[];
    arc_type: EmotionArc['arc_type'];
    climax_index: number;
  }>(prompt, 0.2);

  // Validate and smooth
  const validated = result.sentences.map((s, i) => ({
    text: sentences[i] || s.text,
    primary_emotion: validateEmotion(s.primary_emotion),
    secondary_emotion: s.secondary_emotion ? validateEmotion(s.secondary_emotion) : null,
    intensity: clamp(s.intensity, 0, 1),
    arousal: clamp(s.arousal, 0, 1),
    valence: clamp(s.valence, -1, 1),
  }));

  // Apply intensity smoothing (prevent jarring jumps)
  const smoothed = smoothIntensity(validated);

  // Build mood curve segments
  const moodCurve = buildMoodCurve(smoothed);

  return {
    sentences: smoothed,
    arc_type: result.arc_type || 'wave',
    climax_index: clamp(result.climax_index, 0, smoothed.length - 1),
    mood_curve: moodCurve,
  };
}

/** Split script into sentences preserving punctuation */
function splitSentences(script: string): string[] {
  // Split on sentence-ending punctuation, keeping short fragments together
  const raw = script
    .replace(/\n+/g, ' ')
    .split(/(?<=[.!?…])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  // Merge very short fragments (< 4 words) with previous
  const merged: string[] = [];
  for (const sentence of raw) {
    if (merged.length > 0 && sentence.split(/\s+/).length < 4) {
      merged[merged.length - 1] += ' ' + sentence;
    } else {
      merged.push(sentence);
    }
  }
  return merged;
}

/** Smooth intensity to prevent jarring jumps between adjacent sentences */
function smoothIntensity(tags: EmotionTag[]): EmotionTag[] {
  if (tags.length <= 2) return tags;

  return tags.map((tag, i) => {
    if (i === 0 || i === tags.length - 1) return tag;
    // Weighted average: 20% prev + 60% current + 20% next
    const smoothedIntensity =
      tags[i - 1].intensity * 0.2 +
      tag.intensity * 0.6 +
      tags[i + 1].intensity * 0.2;
    return { ...tag, intensity: smoothedIntensity };
  });
}

/** Group consecutive sentences with similar emotions into mood segments */
function buildMoodCurve(tags: EmotionTag[]): MoodSegment[] {
  if (tags.length === 0) return [];

  const segments: MoodSegment[] = [];
  let segStart = 0;
  let currentMood = emotionToMood(tags[0].primary_emotion);

  for (let i = 1; i < tags.length; i++) {
    const mood = emotionToMood(tags[i].primary_emotion);
    if (mood !== currentMood) {
      const slice = tags.slice(segStart, i);
      segments.push({
        start_sentence: segStart,
        end_sentence: i - 1,
        mood: currentMood,
        avg_intensity: slice.reduce((sum, t) => sum + t.intensity, 0) / slice.length,
      });
      segStart = i;
      currentMood = mood;
    }
  }

  // Final segment
  const slice = tags.slice(segStart);
  segments.push({
    start_sentence: segStart,
    end_sentence: tags.length - 1,
    mood: currentMood,
    avg_intensity: slice.reduce((sum, t) => sum + t.intensity, 0) / slice.length,
  });

  return segments;
}

function validateEmotion(e: string): Emotion {
  if (VALID_EMOTIONS.includes(e as Emotion)) return e as Emotion;
  return 'neutral';
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
