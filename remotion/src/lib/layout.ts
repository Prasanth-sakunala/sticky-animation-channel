/**
 * Layout utilities — letterbox-safe bounds and cinematic framing.
 * 
 * Cinematic 2.39:1 letterbox inside 16:9 (1920x1080) frame:
 * - Total frame: 1920 x 1080
 * - Letterbox bars: ~126px top + ~126px bottom  
 * - Safe area: 1920 x 828, starting at y=126
 */

export const FRAME_W = 1920;
export const FRAME_H = 1080;

// 2.39:1 letterbox inside 16:9
export const LETTERBOX_BAR_H = 126;
export const SAFE_TOP = LETTERBOX_BAR_H;
export const SAFE_BOTTOM = FRAME_H - LETTERBOX_BAR_H;
export const SAFE_HEIGHT = SAFE_BOTTOM - SAFE_TOP; // 828px

/**
 * Convert a percentage-based placement (0-100) to pixel coordinates
 * that are guaranteed to remain inside the letterbox-safe zone.
 */
export function safePosition(
  xPercent: number,
  yPercent: number,
  scale: number = 0.5
): { x: number; y: number; safeScale: number } {
  // Character bounding box estimate (based on ~400px tall character at scale 1.0)
  const charHeight = 400 * scale;
  const charWidth = 200 * scale;

  // Convert percentages to safe-area pixel coords
  const rawX = (xPercent / 100) * FRAME_W;
  const rawY = SAFE_TOP + (yPercent / 100) * SAFE_HEIGHT;

  // Clamp so character never clips outside safe zone
  const x = clamp(rawX, charWidth * 0.5, FRAME_W - charWidth * 0.5);
  const y = clamp(rawY, SAFE_TOP + charHeight * 0.3, SAFE_BOTTOM - charHeight * 0.4);

  return { x, y, safeScale: scale };
}

/**
 * Parallax depth multipliers for 4-layer system.
 * Higher depth = slower movement = feels further away.
 */
export const PARALLAX_DEPTHS = {
  sky: 0.02,    // barely moves
  far: 0.06,   // distant silhouettes
  mid: 0.18,   // main action layer
  fg: 0.45,    // aggressive foreground movement
} as const;

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
