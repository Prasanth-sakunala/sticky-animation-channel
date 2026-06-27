import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

interface TTSOptions {
  text: string;
  outputPath: string;
  voice?: string;
  speed?: number;
}

const KOKORO_URL = process.env.KOKORO_TTS_URL || 'http://localhost:8003';

// Engaging defaults: deep male voice at dramatic pacing
const DEFAULT_VOICE = 'am_adam';
const DEFAULT_SPEED = 0.88;

export async function generateSpeech(options: TTSOptions): Promise<string> {
  const { text, outputPath, voice = DEFAULT_VOICE, speed = DEFAULT_SPEED } = options;

  // Ensure output directory exists
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  return generateWithKokoro(text, outputPath, voice, speed);
}

async function generateWithKokoro(text: string, outputPath: string, voice: string, speed: number): Promise<string> {
  const response = await fetch(`${KOKORO_URL}/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice, speed }),
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => '');
    throw new Error(`Kokoro TTS error ${response.status}: ${errBody}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(outputPath, buffer);
  return outputPath;
}

export async function getAudioDuration(filePath: string): Promise<number> {
  const cmd = `ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${filePath}"`;
  const { stdout } = await execAsync(cmd);
  return parseFloat(stdout.trim());
}
