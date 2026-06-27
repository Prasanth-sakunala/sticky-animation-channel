import { Router } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { generateSpeech, getAudioDuration } from '../services/tts.js';
import { normalizeAudio } from '../services/ffmpeg.js';
import type { SceneData } from '../types.js';
import { outputPath } from '../utils/paths.js';

export const voiceRouter = Router();

const OUTPUT_DIR = outputPath('audio');

// POST /api/voice — generate TTS for all scenes
voiceRouter.post('/', async (req, res) => {
  try {
    const requestBody = Array.isArray(req.body) ? req.body[0] : req.body;
    const projectId = requestBody?.projectId;
    const scenes = (requestBody?.scenes || []).map((scene: SceneData & { naration_text?: string }) => ({
      ...scene,
      narration_text: scene.narration_text || scene.naration_text || '',
    }));

    if (!scenes.length) {
      return res.status(400).json({ error: 'scenes array required' });
    }

    // Voice config — accept from request or use cinematic defaults
    const voice = requestBody?.voice || 'am_adam';
    const speed = requestBody?.speed || 0.88;

    const projectDir = path.join(OUTPUT_DIR, projectId || 'default');
    if (!fs.existsSync(projectDir)) fs.mkdirSync(projectDir, { recursive: true });

    const results: { scene_id: number; audioPath: string; duration: number }[] = [];

    // Generate audio for each scene
    for (const scene of scenes) {
      const filename = `scene_${String(scene.scene_id).padStart(2, '0')}.wav`;
      const outputPath = path.join(projectDir, filename);

      // Clean narration text — convert [PAUSE] markers to ellipses for Kokoro
      const rawText = scene.narration_text || '';
      if (!rawText) {
        console.warn(`Scene ${scene.scene_id}: no narration text found, skipping`);
        continue;
      }
      const cleanText = rawText
        .replaceAll('[PAUSE]', '...')
        .replace(/\[.*?\]/g, '')
        .trim();

      await generateSpeech({ text: cleanText, outputPath, voice, speed });

      // Normalize audio levels
      const normalizedPath = path.join(projectDir, `norm_${filename}`);
      await normalizeAudio(outputPath, normalizedPath);

      // Replace original with normalized
      fs.renameSync(normalizedPath, outputPath);

      const duration = await getAudioDuration(outputPath);
      results.push({ scene_id: scene.scene_id, audioPath: outputPath, duration });
    }

    // Create full narration by concatenating
    if (!results.length) {
      return res.status(400).json({ error: 'no narration text available in scenes' });
    }

    const concatFile = path.join(projectDir, 'concat.txt');
    const concatContent = results.map(r => `file '${r.audioPath.replaceAll('\\', '/')}'`).join('\n');
    fs.writeFileSync(concatFile, concatContent);

    const fullNarrationPath = path.join(projectDir, 'full_narration.wav');
    const { exec } = await import('node:child_process');
    const { promisify } = await import('node:util');
    const execAsync = promisify(exec);
    await execAsync(`ffmpeg -y -f concat -safe 0 -i "${concatFile}" -c copy "${fullNarrationPath}"`);

    // Cleanup concat file
    fs.unlinkSync(concatFile);

    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

    res.json({
      projectId: projectId || 'default',
      scenes: results,
      full_narration: fullNarrationPath,
      total_duration_sec: Math.round(totalDuration * 10) / 10,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
