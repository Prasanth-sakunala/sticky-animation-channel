import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';

const execAsync = promisify(exec);

interface AmplitudeFrame {
  frame: number;
  amplitude: number;
  mouthShape: 'closed' | 'open_small' | 'open_wide';
}

export async function analyzeAudioAmplitude(
  audioPath: string,
  fps: number = 30
): Promise<AmplitudeFrame[]> {
  // Extract raw amplitude data using ffmpeg
  const cmd = `ffprobe -v quiet -show_entries frame=pkt_pts_time -of csv=p=0 -f lavfi "amovie='${audioPath.replace(/\\/g, '/')}',astats=metadata=1:reset=1"`;

  // Simpler approach: get volume levels per frame interval
  const frameDuration = 1 / fps;
  const durationCmd = `ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${audioPath}"`;
  const { stdout: durationStr } = await execAsync(durationCmd);
  const duration = parseFloat(durationStr.trim());
  const totalFrames = Math.ceil(duration * fps);

  // Use volumedetect for overall, then segment analysis
  const segmentDuration = frameDuration * 3; // analyze every 3 frames for efficiency
  const frames: AmplitudeFrame[] = [];

  // Generate amplitude envelope using ffmpeg astats
  const envCmd = `ffmpeg -i "${audioPath}" -af "asetnsamples=${Math.floor(44100 / fps)},astats=metadata=1:reset=1" -f null - 2>&1`;

  try {
    const { stderr } = await execAsync(envCmd, { maxBuffer: 50 * 1024 * 1024 });
    const rmsMatches = stderr.matchAll(/RMS level dB: ([-\d.]+)/g);
    let frameIndex = 0;

    for (const match of rmsMatches) {
      const rmsDb = parseFloat(match[1]);
      // Convert dB to 0-1 amplitude (rough)
      const amplitude = Math.max(0, Math.min(1, (rmsDb + 60) / 60));

      let mouthShape: 'closed' | 'open_small' | 'open_wide';
      if (amplitude < 0.1) mouthShape = 'closed';
      else if (amplitude < 0.5) mouthShape = 'open_small';
      else mouthShape = 'open_wide';

      frames.push({ frame: frameIndex, amplitude, mouthShape });
      frameIndex++;
    }
  } catch {
    // Fallback: generate simple pattern based on duration
    for (let i = 0; i < totalFrames; i++) {
      frames.push({
        frame: i,
        amplitude: 0.3,
        mouthShape: i % 6 < 3 ? 'open_small' : 'closed',
      });
    }
  }

  return frames;
}
