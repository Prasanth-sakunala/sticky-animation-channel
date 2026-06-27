/**
 * Audio Sync — beat-matched timing for visual emphasis.
 * Analyzes TTS audio duration and narration text to determine
 * where emphasis beats fall, driving camera/object/transition timing.
 */

export interface AudioBeat {
  /** Frame number where this beat occurs */
  frame: number;
  /** Strength of the beat (0-1) */
  strength: number;
  /** Type of beat */
  type: 'emphasis' | 'pause' | 'sentence_end' | 'climax';
}

export interface AudioSyncData {
  /** All detected beats in this scene */
  beats: AudioBeat[];
  /** Frame of the strongest emphasis moment */
  peakFrame: number;
  /** Average words-per-frame rate */
  wordsPerFrame: number;
  /** Suggested object injection frames (when attention dips) */
  objectFrames: number[];
}

/**
 * Classify a single word into an audio beat based on punctuation/caps.
 */
function classifyWord(word: string, frame: number): AudioBeat | null {
  // ALL-CAPS emphasis (shouting)
  if (word === word.toUpperCase() && word.length > 2 && /[A-Z]/.test(word)) {
    return { frame, strength: 0.95, type: 'emphasis' };
  }
  if (word.endsWith('!')) return { frame, strength: 0.9, type: 'emphasis' };
  if (word.endsWith('?')) return { frame, strength: 0.7, type: 'emphasis' };
  if (word.includes('...') || word.includes('…')) return { frame, strength: 0.6, type: 'pause' };
  if (word.includes('—')) return { frame, strength: 0.85, type: 'emphasis' };
  if (word.endsWith('.')) return { frame, strength: 0.4, type: 'sentence_end' };
  return null;
}

/**
 * Analyze narration text + audio duration to generate sync beats.
 * Uses punctuation and word patterns as proxy for audio emphasis.
 */
export function generateAudioSync(
  narrationText: string,
  durationInFrames: number,
  fps: number = 30
): AudioSyncData {
  const words = (narrationText || '').split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  if (wordCount === 0) {
    return { beats: [], peakFrame: Math.floor(durationInFrames / 2), wordsPerFrame: 0, objectFrames: [] };
  }

  const wordsPerFrame = wordCount / durationInFrames;
  const framesPerWord = durationInFrames / wordCount;
  const beats: AudioBeat[] = [];

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const wordFrame = Math.round(i * framesPerWord);
    const beat = classifyWord(word, wordFrame);
    if (beat) beats.push(beat);
  }

  // Find peak frame (strongest beat or 70% through if no strong beats)
  let peakFrame = Math.floor(durationInFrames * 0.7);
  let peakStrength = 0;
  for (const beat of beats) {
    if (beat.strength > peakStrength) {
      peakStrength = beat.strength;
      peakFrame = beat.frame;
    }
  }

  // Mark climax beat
  if (peakStrength > 0) {
    const climaxBeat = beats.find((b) => b.frame === peakFrame);
    if (climaxBeat) climaxBeat.type = 'climax';
  }

  // Calculate object injection frames — appear in "quiet" moments between beats
  const objectFrames = calculateObjectFrames(beats, durationInFrames);

  return { beats, peakFrame, wordsPerFrame, objectFrames };
}

/**
 * Find "quiet" frames where objects can appear without competing with narration emphasis.
 * Objects appear between beats where there's sufficient gap.
 */
function calculateObjectFrames(beats: AudioBeat[], durationInFrames: number): number[] {
  const MIN_GAP = 20; // Minimum frames between beats to inject an object
  const frames: number[] = [];

  // Sort beats by frame
  const sorted = [...beats].sort((a, b) => a.frame - b.frame);

  // Find gaps between beats
  let prev = 0;
  for (const beat of sorted) {
    const gap = beat.frame - prev;
    if (gap > MIN_GAP * 2) {
      // Inject object at midpoint of gap
      frames.push(Math.round(prev + gap / 2));
    }
    prev = beat.frame;
  }

  // Check trailing gap
  const tailGap = durationInFrames - prev;
  if (tailGap > MIN_GAP * 2) {
    frames.push(Math.round(prev + tailGap / 2));
  }

  return frames.slice(0, 3); // Max 3 object injections per scene
}

/**
 * Get a camera emphasis multiplier at a given frame based on beats.
 * Returns 1.0 normally, spikes to 1.2-1.5 near emphasis beats.
 * Use this to modulate camera movement intensity in real-time.
 */
export function beatIntensity(frame: number, beats: AudioBeat[]): number {
  let intensity = 1;
  for (const beat of beats) {
    const dist = Math.abs(frame - beat.frame);
    if (dist < 10) {
      // Gaussian spike near beat
      const spike = beat.strength * 0.5 * Math.exp(-(dist * dist) / 18);
      intensity += spike;
    }
  }
  return Math.min(1.5, intensity);
}

/**
 * Determine if the current frame should trigger a visual "hit"
 * (scale pop, brightness flash, etc). Use sparingly.
 */
export function isHitFrame(frame: number, beats: AudioBeat[]): boolean {
  return beats.some((b) => b.type === 'climax' && Math.abs(frame - b.frame) <= 1);
}
