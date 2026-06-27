/**
 * Scene Quality Gate — validates scene packs before rendering.
 * Rejects scene data that would produce poor video output.
 * 
 * Called after storyboard generation and before rendering.
 */

export interface QualityGateResult {
  passed: boolean;
  score: number; // 0-100
  issues: QualityIssue[];
  stats: QualityStats;
}

export interface QualityIssue {
  severity: 'critical' | 'warning';
  code: string;
  message: string;
}

export interface QualityStats {
  totalScenes: number;
  uniqueBackgrounds: number;
  uniqueCharacters: number;
  overlayCount: number;
  emptyObjectScenes: number;
  sameBackgroundStreak: number;
  sameCharacterRatio: number;
  avgDurationSec: number;
}

interface SceneLike {
  scene_id?: number;
  narration_text?: string;
  duration_estimate?: number;
  background?: string;
  character_name?: string;
  objects?: string[];
  text_overlay?: string | { text?: string } | null;
  mood?: string;
  composition?: {
    character?: {
      visible?: boolean;
      name?: string;
      placement?: { x?: number; y?: number; scale?: number };
    };
  };
}

const KNOWN_BACKGROUNDS = new Set([
  'bg01_living_room_day', 'bg02_living_room_night', 'bg03_bedroom_night',
  'bg04_kitchen_day', 'bg05_basement', 'bg06_hallway_night',
  'bg07_garage', 'bg08_attic', 'bg09_office_day',
  'bg10_classroom', 'bg11_hospital_room', 'bg12_convenience_store',
  'bg13_diner', 'bg14_bar_night', 'bg15_church',
  'bg16_gym', 'bg17_suburb_day', 'bg18_suburb_night',
  'bg19_alley_night', 'bg20_parking_lot_night', 'bg21_park_day',
  'bg22_rooftop_night', 'bg23_bridge_night', 'bg24_gas_station_night',
  'bg25_highway_day', 'bg26_downtown_night', 'bg27_forest_day',
  'bg28_forest_night', 'bg29_lake', 'bg30_field_day',
  'bg31_mountain_cliff', 'bg32_cave', 'bg33_beach',
  'bg34_swamp', 'bg35_warehouse', 'bg36_prison_cell',
  'bg37_graveyard_night', 'bg38_courtroom', 'bg39_police_station',
  'bg40_tunnel', 'bg41_rainy_street_night', 'bg42_snowy_suburb',
  'bg43_foggy_forest', 'bg44_stormy_beach', 'bg45_sunset_field',
  'bg46_overcast_city',
]);

const BLOCKED_OVERLAYS = new Set([
  'THE CASE BEGINS', 'THE CLUE', 'TIMELINE', 'CASE FILE',
  'WHAT HAPPENED?', 'THE TURNING POINT',
]);

const KNOWN_CHARACTERS = new Set([
  'marcus', 'victor', 'leo', 'frank', 'rex_male', 'dev',
  'sara', 'diana', 'mia', 'ruth', 'jade', 'priya',
  'tommy', 'jake', 'lily', 'zoe',
  'buddy', 'shadow', 'rex_dog', 'whiskers', 'bear', 'fang', 'patches', 'crow',
]);

export function validateScenePack(scenes: SceneLike[]): QualityGateResult {
  if (!scenes || scenes.length === 0) {
    return {
      passed: false,
      score: 0,
      issues: [{ severity: 'critical', code: 'NO_SCENES', message: 'Scene pack is empty' }],
      stats: emptyStats(),
    };
  }

  const stats = computeStats(scenes);
  const issues = detectIssues(scenes, stats);
  const score = computeScore(issues);
  const passed = score >= 50 && issues.filter((i) => i.severity === 'critical').length === 0;

  return { passed, score, issues, stats };
}

function computeStats(scenes: SceneLike[]): QualityStats {
  const total = scenes.length;

  const visibleCharacters = scenes
    .filter((s) => s.composition?.character?.visible !== false)
    .map((s) => s.character_name || s.composition?.character?.name || '')
    .filter(Boolean);
  const uniqueCharacters = new Set(visibleCharacters);
  const dominantCharacter = getMostCommon(visibleCharacters);
  const sameCharacterRatio = visibleCharacters.length > 0
    ? visibleCharacters.filter((c) => c === dominantCharacter).length / visibleCharacters.length
    : 0;

  const backgrounds = scenes.map((s) => s.background || '').filter(Boolean);
  const uniqueBackgrounds = new Set(backgrounds);
  const sameBackgroundStreak = longestStreak(backgrounds);

  const overlays = scenes.map((s) => normalizeOverlay(s.text_overlay)).filter(Boolean);
  const emptyObjectScenes = scenes.filter((s) => !s.objects || s.objects.length === 0).length;
  const durations = scenes.map((s) => s.duration_estimate || 0);
  const avgDuration = durations.reduce((a, b) => a + b, 0) / total;

  return {
    totalScenes: total,
    uniqueBackgrounds: uniqueBackgrounds.size,
    uniqueCharacters: uniqueCharacters.size,
    overlayCount: overlays.length,
    emptyObjectScenes,
    sameBackgroundStreak,
    sameCharacterRatio,
    avgDurationSec: Math.round(avgDuration * 10) / 10,
  };
}

function detectIssues(scenes: SceneLike[], stats: QualityStats): QualityIssue[] {
  const issues: QualityIssue[] = [];
  const total = stats.totalScenes;

  const durations = scenes.map((s) => s.duration_estimate || 0);
  const totalDuration = durations.reduce((a, b) => a + b, 0);

  if (total < 3) {
    issues.push({ severity: 'critical', code: 'TOO_FEW_SCENES', message: `Only ${total} scenes — minimum is 3` });
  }
  if (totalDuration < 15) {
    issues.push({ severity: 'critical', code: 'TOO_SHORT', message: `Total duration ${totalDuration}s — minimum is 15s` });
  }

  if (stats.sameCharacterRatio > 0.9 && total >= 6) {
    issues.push({ severity: 'warning', code: 'SINGLE_CHARACTER', message: `${(stats.sameCharacterRatio * 100).toFixed(0)}% scenes use same character` });
  }
  if (stats.uniqueBackgrounds < 3 && total >= 8) {
    issues.push({ severity: 'warning', code: 'LOW_BACKGROUND_VARIETY', message: `Only ${stats.uniqueBackgrounds} unique backgrounds for ${total} scenes` });
  }
  if (stats.sameBackgroundStreak > 3) {
    issues.push({ severity: 'warning', code: 'BACKGROUND_STREAK', message: `Same background repeated ${stats.sameBackgroundStreak} scenes in a row` });
  }

  const backgrounds = scenes.map((s) => s.background || '').filter(Boolean);
  const invalidBgs = backgrounds.filter((bg) => !KNOWN_BACKGROUNDS.has(bg));
  if (invalidBgs.length > 2) {
    issues.push({ severity: 'warning', code: 'INVALID_BACKGROUNDS', message: `${invalidBgs.length} scenes use non-existent background assets` });
  }

  if (stats.overlayCount > total * 0.4) {
    issues.push({ severity: 'warning', code: 'OVERLAY_SPAM', message: `${stats.overlayCount}/${total} scenes have text overlays — too many` });
  }

  const overlays = scenes.map((s) => normalizeOverlay(s.text_overlay)).filter(Boolean);
  const blockedCount = overlays.filter((t) => BLOCKED_OVERLAYS.has((t || '').toUpperCase())).length;
  if (blockedCount > 0) {
    issues.push({ severity: 'warning', code: 'BLOCKED_OVERLAYS', message: `${blockedCount} scenes have generic blocked overlay text` });
  }

  const placements = scenes
    .filter((s) => s.composition?.character?.visible !== false && s.composition?.character?.placement)
    .map((s) => s.composition?.character?.placement || { x: 50, y: 60, scale: 0.5 });
  const centeredCount = placements.filter((p) => (p.x ?? 50) >= 44 && (p.x ?? 50) <= 56).length;
  if (placements.length >= 5 && centeredCount / placements.length > 0.7) {
    issues.push({ severity: 'warning', code: 'TOO_CENTERED', message: 'Most characters are center-placed — lacks variety' });
  }

  const visibleCharacters = scenes
    .filter((s) => s.composition?.character?.visible !== false)
    .map((s) => s.character_name || s.composition?.character?.name || '')
    .filter(Boolean);
  const invalidChars = [...new Set(visibleCharacters)].filter((c) => !KNOWN_CHARACTERS.has(c));
  if (invalidChars.length > 0) {
    issues.push({ severity: 'warning', code: 'INVALID_CHARACTERS', message: `Unknown characters: ${invalidChars.join(', ')}` });
  }

  return issues;
}

function computeScore(issues: QualityIssue[]): number {
  let score = 100;
  for (const issue of issues) {
    if (issue.severity === 'critical') score -= 25;
    else score -= 10;
  }
  return Math.max(0, Math.min(100, score));
}

function normalizeOverlay(overlay: SceneLike['text_overlay']): string | null {
  if (!overlay) return null;
  if (typeof overlay === 'string') return overlay.trim() || null;
  return overlay.text?.trim() || null;
}

function getMostCommon(arr: string[]): string {
  const counts = new Map<string, number>();
  for (const item of arr) {
    counts.set(item, (counts.get(item) || 0) + 1);
  }
  let max = 0;
  let result = '';
  for (const [key, count] of counts) {
    if (count > max) {
      max = count;
      result = key;
    }
  }
  return result;
}

function longestStreak(arr: string[]): number {
  let maxStreak = 1;
  let currentStreak = 1;
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] === arr[i - 1]) {
      currentStreak += 1;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }
  return arr.length > 0 ? maxStreak : 0;
}

function emptyStats(): QualityStats {
  return {
    totalScenes: 0,
    uniqueBackgrounds: 0,
    uniqueCharacters: 0,
    overlayCount: 0,
    emptyObjectScenes: 0,
    sameBackgroundStreak: 0,
    sameCharacterRatio: 0,
    avgDurationSec: 0,
  };
}
