import { Router } from 'express';
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import type { SceneData } from '../types.js';
import { outputPath, REMOTION_ROOT_DIR } from '../utils/paths.js';

export const renderRouter = Router();

const REMOTION_DIR = REMOTION_ROOT_DIR;
const OUTPUT_DIR = outputPath('scenes');
const NPX_COMMAND = process.platform === 'win32' ? 'npx.cmd' : 'npx';

// Render timeout is calculated dynamically based on frame count.
// Base: 45 minutes minimum + 2 seconds per frame.
// A 5-min video (~9000 frames) gets ~45 min. A 15-min video (~27000 frames) gets ~60 min.
const BASE_TIMEOUT_MS = 45 * 60 * 1000;
const PER_FRAME_TIMEOUT_MS = 2000;

// Track active renders for status checking
const activeRenders: Map<string, {
  status: 'rendering' | 'done' | 'failed';
  startTime: number;
  progress: string[];
  lastProgressLine: string;
  pid?: number;
  error?: string;
  outputFile?: string;
}> = new Map();

// GET /api/render/status/:projectId — check render progress without waiting
renderRouter.get('/status/:projectId', (req, res) => {
  const { projectId } = req.params;
  const render = activeRenders.get(projectId);

  if (!render) {
    return res.status(404).json({ error: 'No active render found for this projectId' });
  }

  const elapsedSec = Math.round((Date.now() - render.startTime) / 1000);
  res.json({
    projectId,
    status: render.status,
    elapsedSec,
    lastProgress: render.lastProgressLine,
    recentLogs: render.progress.slice(-20),
    pid: render.pid,
    error: render.error,
    outputFile: render.outputFile,
  });
});

// GET /api/render/status — list all renders
renderRouter.get('/status', (_req, res) => {
  const renders: any[] = [];
  for (const [projectId, render] of activeRenders) {
    renders.push({
      projectId,
      status: render.status,
      elapsedSec: Math.round((Date.now() - render.startTime) / 1000),
      lastProgress: render.lastProgressLine,
    });
  }
  res.json(renders);
});

// POST /api/render — render all scenes using Remotion
renderRouter.post('/', async (req, res) => {
  try {
    const requestBody = Array.isArray(req.body) ? req.body[0] : req.body;
    const { scenes, projectId, audioTimings } = requestBody as {
      scenes: SceneData[];
      projectId: string;
      audioTimings: { scene_id: number; duration: number }[];
    };

    if (!scenes || !Array.isArray(scenes)) {
      return res.status(400).json({ error: 'scenes array required' });
    }

    const projectOutputDir = path.join(OUTPUT_DIR, projectId || 'default');
    if (!fs.existsSync(projectOutputDir)) fs.mkdirSync(projectOutputDir, { recursive: true });

    if (!fs.existsSync(REMOTION_DIR)) {
      return res.status(500).json({ error: `Remotion directory not found: ${REMOTION_DIR}` });
    }

    // Write scene data as input props for Remotion
    const propsPath = path.join(projectOutputDir, 'input-props.json');
    const fps = 30;

    // Merge audio timings into scenes
    const scenesWithTiming = scenes.map(scene => {
      const timing = audioTimings?.find(t => t.scene_id === scene.scene_id);
      const duration = timing?.duration || scene.duration_estimate;
      return {
        ...scene,
        actual_duration: duration,
        durationInFrames: Math.ceil(duration * fps),
      };
    });

    const totalFrames = scenesWithTiming.reduce((sum, s) => sum + s.durationInFrames, 0);

    const inputProps = {
      scenes: scenesWithTiming,
      fps,
      totalFrames,
    };

    fs.writeFileSync(propsPath, JSON.stringify(inputProps, null, 2));

    // Render using Remotion CLI
    const outputFile = path.join(projectOutputDir, 'full_video.mp4');
    const renderArgs = [
      'remotion',
      'render',
      '--props',
      propsPath,
      '--composition=Story',
      '--output',
      outputFile,
      '--codec=h264',
      '--concurrency=4',
      `--frames=0-${Math.max(totalFrames - 1, 0)}`,
    ];

    console.log(`Rendering: ${NPX_COMMAND} ${renderArgs.join(' ')}`);

    // Track this render
    const trackingId = projectId || 'default';
    activeRenders.set(trackingId, {
      status: 'rendering',
      startTime: Date.now(),
      progress: [],
      lastProgressLine: 'Starting render...',
    });

    const result = await new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
      let stdout = '';
      let stderr = '';
      const child = spawn(NPX_COMMAND, renderArgs, {
        cwd: REMOTION_DIR,
        env: { ...process.env },
      });

      const renderState = activeRenders.get(trackingId)!;
      renderState.pid = child.pid;

      // Dynamic timeout based on frame count
      const renderTimeoutMs = BASE_TIMEOUT_MS + (totalFrames * PER_FRAME_TIMEOUT_MS);
      const timeoutMinutes = Math.round(renderTimeoutMs / 60000);
      console.log(`[RENDER] Timeout set to ${timeoutMinutes} minutes for ${totalFrames} frames`);

      const timeout = setTimeout(() => {
        console.error(`[RENDER TIMEOUT] Killing render for ${trackingId} after ${timeoutMinutes} min`);
        child.kill('SIGKILL');
        renderState.status = 'failed';
        renderState.error = `Render timed out after ${timeoutMinutes} minutes`;
        reject(new Error(`Render timed out after ${timeoutMinutes} minutes. Last progress: ${renderState.lastProgressLine}`));
      }, renderTimeoutMs);

      child.stdout.on('data', (data) => {
        const text = data.toString();
        stdout += text;
        // Parse progress lines from Remotion output
        const lines = text.split('\n').filter((l: string) => l.trim());
        for (const line of lines) {
          renderState.progress.push(line);
          if (renderState.progress.length > 100) renderState.progress.shift();
          renderState.lastProgressLine = line;
        }
        // Log progress to console for Docker logs visibility
        process.stdout.write(text);
      });

      child.stderr.on('data', (data) => {
        const text = data.toString();
        stderr += text;
        const lines = text.split('\n').filter((l: string) => l.trim());
        for (const line of lines) {
          renderState.progress.push(`[stderr] ${line}`);
          if (renderState.progress.length > 100) renderState.progress.shift();
          renderState.lastProgressLine = line;
        }
        process.stderr.write(text);
      });

      child.on('error', (err) => {
        clearTimeout(timeout);
        renderState.status = 'failed';
        renderState.error = err.message;
        reject(err);
      });

      child.on('close', (code) => {
        clearTimeout(timeout);
        if (code === 0) {
          renderState.status = 'done';
          renderState.outputFile = outputFile;
          resolve({ stdout, stderr });
        } else {
          renderState.status = 'failed';
          renderState.error = `Render exited with code ${code}`;
          reject(new Error(`Render exited with code ${code}\n${stderr.slice(-2000)}`));
        }
      });
    });

    console.log(result.stdout);
    if (result.stderr) console.warn(result.stderr);

    res.json({
      projectId: projectId || 'default',
      outputFile,
      totalFrames,
      durationSec: Math.round(totalFrames / fps),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
