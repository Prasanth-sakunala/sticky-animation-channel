import { interpolate, Easing, spring } from 'remotion';

export function easeInOut(frame: number, start: number, end: number, from: number, to: number): number {
  return interpolate(frame, [start, end], [from, to], {
    easing: Easing.inOut(Easing.ease),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
}

export function easeIn(frame: number, start: number, end: number, from: number, to: number): number {
  return interpolate(frame, [start, end], [from, to], {
    easing: Easing.in(Easing.ease),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
}

export function easeOut(frame: number, start: number, end: number, from: number, to: number): number {
  return interpolate(frame, [start, end], [from, to], {
    easing: Easing.out(Easing.ease),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
}

export function shake(frame: number, intensity: number = 3): { x: number; y: number } {
  const x = Math.sin(frame * 0.7) * intensity + Math.sin(frame * 1.3) * intensity * 0.5;
  const y = Math.cos(frame * 0.9) * intensity + Math.cos(frame * 1.7) * intensity * 0.5;
  return { x, y };
}

/** ScaleY oscillation simulating idle breathing — visible at render scale */
export function breathing(frame: number, rate: number = 0.06, amplitude: number = 0.03): number {
  return 1 + Math.sin(frame * rate * Math.PI) * amplitude;
}

/** Vertical bob for walking/movement animation — visible bounce */
export function walkBob(frame: number, speed: number = 0.22, height: number = 12): number {
  return Math.abs(Math.sin(frame * speed)) * height;
}

/** Slight body tilt during walk for realism */
export function walkTilt(frame: number, speed: number = 0.22, degrees: number = 2.5): number {
  return Math.sin(frame * speed) * degrees;
}

/** Horizontal walk drift across screen */
export function walkDrift(frame: number, duration: number, startX: number, endX: number): number {
  return easeInOut(frame, 0, duration, startX, endX);
}

/** Spring-based entrance for overlays */
export function springIn(frame: number, fps: number, delay: number = 0): number {
  if (frame < delay) return 0;
  return spring({ frame: frame - delay, fps, config: { damping: 14, stiffness: 120, mass: 0.8 } });
}

/** Cinematic zoom intensifying mid-scene — dramatic, visible scales */
export function cinematicZoom(frame: number, duration: number, intensity: 'low' | 'medium' | 'high' = 'medium'): number {
  const maxScale = intensity === 'high' ? 1.25 : intensity === 'medium' ? 1.16 : 1.09;
  const peakFrame = duration * 0.7;
  if (frame <= peakFrame) {
    return easeInOut(frame, 0, peakFrame, 1.0, maxScale);
  }
  return maxScale;
}

/** Parallax offset for layered background depth — strong enough to see */
export function parallax(frame: number, duration: number, layerDepth: number, direction: 'left' | 'right' = 'left'): number {
  const maxOffset = layerDepth * 100;
  const sign = direction === 'left' ? -1 : 1;
  return easeInOut(frame, 0, duration, 0, maxOffset * sign);
}

/** Day/night shift blend factor */
export function dayNightFactor(frame: number, duration: number, isNight: boolean): number {
  if (isNight) {
    return easeInOut(frame, 0, Math.min(45, duration), 0.5, 1.0);
  }
  return easeInOut(frame, 0, Math.min(45, duration), 0.1, 0.0);
}

/** Deterministic particle drift for snow/rain — higher opacity, faster drift */
export function particlePosition(particleId: number, frame: number, canvasWidth: number, canvasHeight: number, speed: number = 1): { x: number; y: number; opacity: number } {
  const seed = particleId * 137.5;
  const startX = ((seed * 7.3) % canvasWidth);
  const drift = Math.sin((frame + seed) * 0.035) * 50;
  const fallProgress = ((frame * speed * 1.5 + seed * 3) % (canvasHeight + 100)) / (canvasHeight + 100);
  const x = startX + drift;
  const y = fallProgress * (canvasHeight + 50) - 50;
  const opacity = interpolate(fallProgress, [0, 0.08, 0.8, 1], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return { x, y, opacity };
}
