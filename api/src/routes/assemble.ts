import { Router } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { assembleVideo } from '../services/ffmpeg.js';
import { assetsPath, outputPath } from '../utils/paths.js';

export const assembleRouter = Router();

const OUTPUT_DIR = outputPath();
const MUSIC_EXTENSIONS = new Set(['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac']);

// POST /api/assemble — combine rendered video + audio + music
assembleRouter.post('/', async (req, res) => {
  try {
    const { projectId } = req.body;
    const useNvenc = parseBoolean(req.body?.useNvenc, false);
    if (!projectId) {
      return res.status(400).json({ error: 'projectId required' });
    }

    const scenesDir = path.join(OUTPUT_DIR, 'scenes', projectId);
    const audioDir = path.join(OUTPUT_DIR, 'audio', projectId);
    const finalDir = path.join(OUTPUT_DIR, 'final', projectId);

    if (!fs.existsSync(finalDir)) fs.mkdirSync(finalDir, { recursive: true });

    // Get rendered video
    const videoPath = path.join(scenesDir, 'full_video.mp4');
    if (!fs.existsSync(videoPath)) {
      return res.status(404).json({ error: 'Rendered video not found. Run /api/render first.' });
    }

    // Get narration audio
    const narrationPath = path.join(audioDir, 'full_narration.wav');
    if (!fs.existsSync(narrationPath)) {
      return res.status(404).json({ error: 'Narration audio not found. Run /api/voice first.' });
    }

    // Find background music (optional)
    const musicDir = assetsPath('music');
    let musicPath: string | undefined;
    if (fs.existsSync(musicDir)) {
      // Read scene props to determine mood
      const propsPath = path.join(scenesDir, 'input-props.json');
      if (fs.existsSync(propsPath)) {
        const props = JSON.parse(fs.readFileSync(propsPath, 'utf-8'));
        const moods = props.scenes.map((s: any) => s.mood);
        // Find dominant mood
        const moodCount: Record<string, number> = {};
        moods.forEach((m: string) => { moodCount[m] = (moodCount[m] || 0) + 1; });
        const dominantMood = Object.entries(moodCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'mysterious';

        musicPath = selectMusicTrack(musicDir, dominantMood);
      }
    }

    const outputPath = path.join(finalDir, 'final_video.mp4');

    await assembleVideo({
      sceneClips: [videoPath],
      narrationPath,
      musicPath,
      outputPath,
      useNvenc,
    });

    const stat = fs.statSync(outputPath);

    res.json({
      projectId,
      outputPath,
      fileSizeMB: Math.round(stat.size / 1024 / 1024 * 10) / 10,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

function parseBoolean(value: unknown, defaultValue: boolean): boolean {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }

  return defaultValue;
}

function selectMusicTrack(musicDir: string, dominantMood: string): string | undefined {
  const musicFiles = fs.readdirSync(musicDir).filter((file) => {
    const ext = path.extname(file).toLowerCase();
    return MUSIC_EXTENSIONS.has(ext);
  });

  if (musicFiles.length === 0) {
    return undefined;
  }

  const normalizedMood = dominantMood.toLowerCase();
  const matchingMood = musicFiles.filter((file) => file.toLowerCase().includes(normalizedMood));
  const candidates = matchingMood.length > 0 ? matchingMood : musicFiles;
  return path.join(musicDir, candidates[Math.floor(Math.random() * candidates.length)]);
}
