import fs from 'node:fs';
import path from 'node:path';

type SceneLike = {
  scene_id?: number;
  narration_text?: string;
  background?: string;
  character_name?: string | null;
  character_pose?: string;
  character_expression?: string;
  objects?: string[];
  camera?: string;
  transition?: string;
  text_overlay?: string | { text?: string } | null;
  mood?: string;
  scene_type?: string;
  shot_type?: string;
  character_action?: string;
  composition?: {
    character?: {
      visible?: boolean;
      name?: string;
      pose?: string;
      placement?: { x?: number; y?: number; scale?: number };
    };
    camera?: {
      movement?: string;
    };
  };
};

type InputProps = {
  scenes?: SceneLike[];
};

const GENERIC_BACKGROUNDS = new Set([
  'generic_dark',
  'generic_light',
  'old_room',
  'suburban_house',
  'street',
  'city_night',
  'dark_forest',
  'snowy_mountain',
  'laboratory',
]);

const GENERIC_OBJECTS = new Set([
  'question_mark',
  'exclamation',
  'fire',
  'skull',
  'magnifying_glass',
  'snow_particles',
  'rain',
  'moon',
  'mountain_silhouette',
  'flashlight_beam',
]);

const STATIC_CAMERAS = new Set(['static']);

const projectId = process.argv[2];

if (!projectId) {
  console.error('Usage: npm run review -- <projectId>');
  process.exit(1);
}

const propsPath = path.resolve(process.cwd(), '..', 'output', 'scenes', projectId, 'input-props.json');

if (!fs.existsSync(propsPath)) {
  console.error(`Input props not found: ${propsPath}`);
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(propsPath, 'utf-8')) as InputProps;
const scenes = data.scenes || [];

const report = buildReport(scenes);
printReport(projectId, propsPath, report);

function buildReport(scenes: SceneLike[]) {
  const total = scenes.length;
  const backgroundCounts = countBy(scenes, (s) => s.background || 'missing');
  const characterCounts = countBy(scenes, (s) => {
    if (s.composition?.character?.visible === false) return 'hidden';
    return s.composition?.character?.name || s.character_name || 'missing';
  });
  const poseCounts = countBy(scenes, (s) => s.composition?.character?.pose || s.character_pose || 'missing');
  const objectCounts = countBy(flatMap(scenes, (s) => s.objects || []), (o) => o || 'missing');
  const cameraCounts = countBy(scenes, (s) => s.composition?.camera?.movement || s.camera || 'missing');
  const transitionCounts = countBy(scenes, (s) => s.transition || 'missing');
  const sceneTypeCounts = countBy(scenes, (s) => s.scene_type || 'missing');
  const shotTypeCounts = countBy(scenes, (s) => s.shot_type || 'missing');
  const actionCounts = countBy(scenes, (s) => s.character_action || 'missing');

  const scenesWithNoObjects = scenes.filter((s) => !s.objects || s.objects.length === 0).length;
  const scenesWithOverlay = scenes.filter((s) => Boolean(normalizeOverlay(s.text_overlay))).length;
  const narratorDominantScenes = scenes.filter((s) => {
    if (s.composition?.character?.visible === false) return false;
    const name = s.composition?.character?.name || s.character_name;
    const rendererWillDefaultToNarrator = !s.composition && Boolean(s.character_pose || s.character_expression);
    return (Boolean(name) || rendererWillDefaultToNarrator) && (!s.objects || s.objects.length <= 1);
  }).length;
  const staticScenes = scenes.filter((s) => STATIC_CAMERAS.has(s.composition?.camera?.movement || s.camera || '')).length;
  const genericBackgroundScenes = scenes.filter((s) => GENERIC_BACKGROUNDS.has(s.background || '') || !String(s.background || '').startsWith('bg')).length;
  const genericObjectScenes = scenes.filter((s) => (s.objects || []).some((o) => GENERIC_OBJECTS.has(o))).length;
  const centeredCharacterScenes = scenes.filter((s) => {
    const character = s.composition?.character;
    if (character?.visible === false) return false;
    if (!s.composition && (s.character_pose || s.character_expression)) return true;
    const x = character?.placement?.x;
    return typeof x === 'number' && x >= 44 && x <= 56;
  }).length;
  const hiddenCharacterScenes = scenes.filter((s) => s.composition?.character?.visible === false).length;

  return {
    total,
    backgroundCounts,
    characterCounts,
    poseCounts,
    objectCounts,
    cameraCounts,
    transitionCounts,
    sceneTypeCounts,
    scenesWithNoObjects,
    scenesWithOverlay,
    narratorDominantScenes,
    staticScenes,
    genericBackgroundScenes,
    genericObjectScenes,
    centeredCharacterScenes,
    hiddenCharacterScenes,
    ratios: {
      overlays: ratio(scenesWithOverlay, total),
      noObjects: ratio(scenesWithNoObjects, total),
      narratorDominant: ratio(narratorDominantScenes, total),
      static: ratio(staticScenes, total),
      genericBackgrounds: ratio(genericBackgroundScenes, total),
      genericObjects: ratio(genericObjectScenes, total),
      centeredCharacters: ratio(centeredCharacterScenes, total),
      hiddenCharacters: ratio(hiddenCharacterScenes, total),
    },
    shotTypeCounts,
    actionCounts,
  };
}

function printReport(projectId: string, propsPath: string, report: ReturnType<typeof buildReport>) {
  console.log(`Video Review Report: ${projectId}`);
  console.log(`Props: ${propsPath}`);
  console.log('');
  console.log(`Total scenes: ${report.total}`);
  console.log(`Text overlays: ${report.scenesWithOverlay} (${report.ratios.overlays})`);
  console.log(`Scenes with no objects: ${report.scenesWithNoObjects} (${report.ratios.noObjects})`);
  console.log(`Narrator-dominant scenes: ${report.narratorDominantScenes} (${report.ratios.narratorDominant})`);
  console.log(`Static camera scenes: ${report.staticScenes} (${report.ratios.static})`);
  console.log(`Generic/fallback background scenes: ${report.genericBackgroundScenes} (${report.ratios.genericBackgrounds})`);
  console.log(`Scenes with generic symbolic objects: ${report.genericObjectScenes} (${report.ratios.genericObjects})`);
  console.log(`Centered character scenes: ${report.centeredCharacterScenes} (${report.ratios.centeredCharacters})`);
  console.log(`Hidden/story-event scenes: ${report.hiddenCharacterScenes} (${report.ratios.hiddenCharacters})`);
  console.log('');
  printTop('Backgrounds', report.backgroundCounts);
  printTop('Scene types', report.sceneTypeCounts);
  printTop('Shot types', report.shotTypeCounts);
  printTop('Character actions', report.actionCounts);
  printTop('Characters', report.characterCounts);
  printTop('Poses', report.poseCounts);
  printTop('Objects', report.objectCounts);
  printTop('Cameras', report.cameraCounts);
  printTop('Transitions', report.transitionCounts);
}

function countBy<T>(items: T[], keyFn: (item: T) => string): [string, number][] {
  const counts = new Map<string, number>();
  for (const item of items) {
    const key = keyFn(item);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

function flatMap<T, U>(items: T[], mapper: (item: T) => U[]): U[] {
  return items.reduce<U[]>((all, item) => all.concat(mapper(item)), []);
}

function ratio(value: number, total: number): string {
  if (total === 0) return '0.0%';
  return `${((value / total) * 100).toFixed(1)}%`;
}

function normalizeOverlay(overlay: SceneLike['text_overlay']): string | null {
  if (!overlay) return null;
  if (typeof overlay === 'string') return overlay.trim() || null;
  return overlay.text?.trim() || null;
}

function printTop(label: string, rows: [string, number][], limit = 12) {
  console.log(`${label}:`);
  for (const [key, value] of rows.slice(0, limit)) {
    console.log(`  ${key}: ${value}`);
  }
  if (rows.length === 0) {
    console.log('  none');
  }
  console.log('');
}
