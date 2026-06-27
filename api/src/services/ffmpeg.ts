import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

const execAsync = promisify(exec);

const NVENC_UNAVAILABLE_PATTERNS = [
  'cannot load libcuda.so.1',
  'cannot load libnvidia-encode.so.1',
  'no nvenc capable devices found',
  'error while opening encoder for output stream',
  'unknown encoder \'h264_nvenc\'',
];

interface AssembleOptions {
  sceneClips: string[];       // Paths to rendered scene MP4s
  narrationPath: string;      // Full narration audio
  musicPath?: string;         // Background music
  outputPath: string;         // Final output path
  useNvenc?: boolean;         // Use GPU encoding
}

export async function assembleVideo(options: AssembleOptions): Promise<string> {
  const { sceneClips, narrationPath, musicPath, outputPath, useNvenc = false } = options;
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  let tempDir: string | undefined;
  try {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sticky-assembly-'));
    const rawVideo = await prepareRawVideo(sceneClips, tempDir);

    // Step 3: Mix audio with sidechain ducking (music dips during voice, swells in pauses)
    let finalAudio = narrationPath;
    if (musicPath && fs.existsSync(musicPath)) {
      finalAudio = path.join(tempDir, 'mixed_audio.wav');
      // sidechaincompress: voice triggers duck on music
      // ratio=6 = strong duck, attack=0.01 = fast response, release=0.8 = smooth swell back
      // volume=0.08 = music at ~-22dB base level
      await execAsync(
        `ffmpeg -y -i "${narrationPath}" -stream_loop -1 -i "${musicPath}" ` +
        `-filter_complex "` +
        `[1:a]volume=0.08,afade=t=in:d=2[music];` +
        `[music][0:a]sidechaincompress=threshold=0.02:ratio=6:attack=10:release=800:level_sc=1[ducked];` +
        `[0:a][ducked]amix=inputs=2:duration=first:dropout_transition=2[out]" ` +
        `-map "[out]" "${finalAudio}"`
      );
    }

    // Step 4: Combine video + audio. FFmpeg finalizes the MP4 in local temp
    // storage first to avoid trailer write failures on Docker bind mounts.
    const tempOutputPath = path.join(tempDir, 'final_video.mp4');
    try {
      await muxFinalVideo({
        rawVideo,
        finalAudio,
        outputPath: tempOutputPath,
        videoCodec: useNvenc ? 'h264_nvenc' : 'libx264',
      });
    } catch (error) {
      if (!useNvenc || !isNvencUnavailable(error)) {
        throw error;
      }

      console.warn('NVENC unavailable, retrying final assembly with libx264');
      await muxFinalVideo({
        rawVideo,
        finalAudio,
        outputPath: tempOutputPath,
        videoCodec: 'libx264',
      });
    }

    fs.copyFileSync(tempOutputPath, outputPath);
    return outputPath;
  } finally {
    if (tempDir) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }
}

export async function normalizeAudio(inputPath: string, outputPath: string): Promise<string> {
  await execAsync(
    `ffmpeg -y -i "${inputPath}" -af loudnorm=I=-16:TP=-1.5:LRA=11 "${outputPath}"`
  );
  return outputPath;
}

async function muxFinalVideo(options: {
  rawVideo: string;
  finalAudio: string;
  outputPath: string;
  videoCodec: 'h264_nvenc' | 'libx264';
}): Promise<void> {
  const { rawVideo, finalAudio, outputPath, videoCodec } = options;
  const videoArgs = videoCodec === 'h264_nvenc'
    ? '-c:v h264_nvenc -preset p4'
    : '-c:v libx264 -preset medium -crf 20';

  await execAsync(
    `ffmpeg -y -i "${rawVideo}" -i "${finalAudio}" ` +
    `-map 0:v:0 -map 1:a:0 ${videoArgs} -pix_fmt yuv420p ` +
    `-c:a aac -ar 48000 -shortest -movflags +faststart "${outputPath}"`
  );
}

async function prepareRawVideo(sceneClips: string[], tempDir: string): Promise<string> {
  if (sceneClips.length === 0) {
    throw new Error('No scene clips provided for assembly');
  }

  if (sceneClips.length === 1) {
    return sceneClips[0];
  }

  // Step 1: Create concat file
  const concatFile = path.join(tempDir, 'scenes.txt');
  const concatContent = sceneClips.map(f => `file '${f.replaceAll('\\', '/')}'`).join('\n');
  fs.writeFileSync(concatFile, concatContent);

  // Step 2: Concatenate scene clips
  const rawVideo = path.join(tempDir, 'raw_video.mp4');
  await execAsync(`ffmpeg -y -f concat -safe 0 -i "${concatFile}" -c copy "${rawVideo}"`);
  return rawVideo;
}

function isNvencUnavailable(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return NVENC_UNAVAILABLE_PATTERNS.some((pattern) => message.includes(pattern));
}
