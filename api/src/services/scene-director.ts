import { generateJSON } from './gemini.js';

/**
 * Scene Director — AI-driven composition brief generator.
 * Converts narration text into structured visual composition briefs
 * with asset tokens that map to our procedural SVG library.
 */

export interface CompositionBrief {
  scene_id: number;
  narration_text: string;
  duration_estimate: number;

  // Visual composition
  environment: EnvironmentBrief;
  character: CharacterBrief;
  camera: CameraBrief;
  lighting: LightingBrief;
  mood: MoodKey;
  text_overlay: string | null;
}

export interface EnvironmentBrief {
  /** Color palette — 5 hex values: [darkest, dark, mid, light, accent] */
  palette: [string, string, string, string, string];
  /** Sky/atmosphere layer assets */
  sky_tokens: SkyToken[];
  /** Far background silhouettes */
  far_tokens: FarToken[];
  /** Midground interactive elements */
  mid_tokens: MidToken[];
  /** Foreground framing elements */
  fg_tokens: FgToken[];
}

export interface CharacterBrief {
  visible: boolean;
  placement: { x: number; y: number; scale: number };
  pose: PoseKey;
  expression: ExpressionKey;
  silhouette: boolean; // backlit character = black fill only
}

export interface CameraBrief {
  movement: CameraMovementKey;
  focal_point: { x: number; y: number }; // 0-100 percentage
  intensity: 'subtle' | 'moderate' | 'dramatic';
}

export interface LightingBrief {
  type: LightingType;
  direction: LightDirection;
  color: string; // hex
  intensity: number; // 0.0 - 1.0
}

// Asset Token Types — each maps to a procedural SVG generator
export type SkyToken =
  | 'gradient_night' | 'gradient_sunset' | 'gradient_overcast' | 'gradient_dawn'
  | 'stars_sparse' | 'stars_dense' | 'clouds_wispy' | 'clouds_heavy'
  | 'aurora' | 'moon_full' | 'moon_crescent' | 'sun_low';

export type FarToken =
  | 'mountains_jagged' | 'mountains_rolling' | 'hills_gentle'
  | 'cityscape_dense' | 'cityscape_sparse' | 'treeline_pine' | 'treeline_deciduous'
  | 'desert_dunes' | 'ocean_horizon' | 'cliff_face'
  | 'ruins_ancient' | 'industrial_pipes' | 'castle_silhouette';

export type MidToken =
  | 'forest_dense' | 'forest_sparse' | 'field_grass' | 'field_snow'
  | 'road_winding' | 'path_dirt' | 'river_calm' | 'lake_still'
  | 'buildings_row' | 'house_single' | 'cabin_wooden'
  | 'lab_equipment' | 'desk_workspace' | 'bed_room'
  | 'cave_interior' | 'tunnel_dark' | 'bridge_stone'
  | 'debris_scattered' | 'tombstones' | 'campfire';

export type FgToken =
  | 'frame_rocks' | 'frame_trees' | 'frame_pillars' | 'frame_doorway'
  | 'frame_vines' | 'frame_fog' | 'frame_bars' | 'frame_cave_mouth'
  | 'ground_grass' | 'ground_snow' | 'ground_sand' | 'ground_concrete'
  | 'particles_dust' | 'particles_snow' | 'particles_rain' | 'particles_embers';

export type MoodKey = 'tense' | 'mysterious' | 'calm' | 'dramatic' | 'upbeat' | 'eerie' | 'melancholic' | 'triumphant';
export type PoseKey = 'standing_neutral' | 'standing_serious' | 'standing_excited' | 'sitting_thinking' | 'pointing_left' | 'pointing_right' | 'hands_up' | 'arms_crossed' | 'crouching' | 'walking';
export type ExpressionKey = 'neutral' | 'surprised' | 'thinking' | 'scared' | 'excited' | 'confused' | 'angry' | 'happy' | 'determined' | 'sad';
export type CameraMovementKey = 'static' | 'slow_zoom_in' | 'slow_zoom_out' | 'pan_left' | 'pan_right' | 'drift_up' | 'shake' | 'dolly_in' | 'orbit' | 'push_in' | 'pull_back' | 'tilt_up' | 'tilt_down' | 'crane_up';
export type LightingType = 'ambient' | 'directional' | 'spotlight' | 'rim_light' | 'backlit';
export type LightDirection = 'top_left' | 'top_right' | 'bottom_left' | 'bottom_right' | 'center' | 'behind';

// All valid token values for validation
const VALID_SKY_TOKENS: SkyToken[] = ['gradient_night', 'gradient_sunset', 'gradient_overcast', 'gradient_dawn', 'stars_sparse', 'stars_dense', 'clouds_wispy', 'clouds_heavy', 'aurora', 'moon_full', 'moon_crescent', 'sun_low'];
const VALID_FAR_TOKENS: FarToken[] = ['mountains_jagged', 'mountains_rolling', 'hills_gentle', 'cityscape_dense', 'cityscape_sparse', 'treeline_pine', 'treeline_deciduous', 'desert_dunes', 'ocean_horizon', 'cliff_face', 'ruins_ancient', 'industrial_pipes', 'castle_silhouette'];
const VALID_MID_TOKENS: MidToken[] = ['forest_dense', 'forest_sparse', 'field_grass', 'field_snow', 'road_winding', 'path_dirt', 'river_calm', 'lake_still', 'buildings_row', 'house_single', 'cabin_wooden', 'lab_equipment', 'desk_workspace', 'bed_room', 'cave_interior', 'tunnel_dark', 'bridge_stone', 'debris_scattered', 'tombstones', 'campfire'];
const VALID_FG_TOKENS: FgToken[] = ['frame_rocks', 'frame_trees', 'frame_pillars', 'frame_doorway', 'frame_vines', 'frame_fog', 'frame_bars', 'frame_cave_mouth', 'ground_grass', 'ground_snow', 'ground_sand', 'ground_concrete', 'particles_dust', 'particles_snow', 'particles_rain', 'particles_embers'];

export async function generateCompositionBriefs(
  script: string,
  title: string
): Promise<CompositionBrief[]> {
  const prompt = `You are a cinematic art director for animated YouTube videos. Break this narration into visual scenes and generate a COMPOSITION BRIEF for each.

TITLE: ${title}
SCRIPT:
"""
${script}
"""

Each scene = 3-8 seconds of narration (8-20 words).

FOR EACH SCENE, output a composition brief with these EXACT structural tokens.

ASSET TOKEN LIBRARY (use ONLY these values):

SKY_TOKENS (1-3 per scene): ${VALID_SKY_TOKENS.join(', ')}
FAR_TOKENS (1-2 per scene): ${VALID_FAR_TOKENS.join(', ')}
MID_TOKENS (1-3 per scene): ${VALID_MID_TOKENS.join(', ')}
FG_TOKENS (1-2 per scene): ${VALID_FG_TOKENS.join(', ')}

POSE: standing_neutral, standing_serious, standing_excited, sitting_thinking, pointing_left, pointing_right, hands_up, arms_crossed, crouching, walking
EXPRESSION: neutral, surprised, thinking, scared, excited, confused, angry, happy, determined, sad
CAMERA: static, slow_zoom_in, slow_zoom_out, pan_left, pan_right, drift_up, shake, dolly_in, orbit, push_in, pull_back, tilt_up, tilt_down, crane_up
MOOD: tense, mysterious, calm, dramatic, upbeat, eerie, melancholic, triumphant
LIGHTING_TYPE: ambient, directional, spotlight, rim_light, backlit
LIGHTING_DIRECTION: top_left, top_right, bottom_left, bottom_right, center, behind

COMPOSITION RULES:
1. Character placement: x (0-100), y (30-75 to stay in letterbox safe zone), scale (0.3-0.8)
2. Wide establishing shots: character small (scale 0.3-0.4), centered
3. Close-up tension: character large (scale 0.7-0.8), off-center
4. palette: [darkest, dark, mid, light, accent] — 5 hex colors that define the scene mood
5. Vary camera between scenes — never two identical movements in a row
6. Backlit silhouette (silhouette: true) for dramatic reveals
7. focal_point guides where the camera drifts toward (0-100 x/y percentage)

Output JSON:
{
  "scenes": [
    {
      "scene_id": 1,
      "narration_text": "exact text from script",
      "duration_estimate": 5,
      "environment": {
        "palette": ["#0a0a14", "#1a1a2e", "#2d3a4a", "#6a8ca8", "#ff6b4a"],
        "sky_tokens": ["gradient_night", "stars_sparse"],
        "far_tokens": ["mountains_jagged"],
        "mid_tokens": ["forest_sparse", "path_dirt"],
        "fg_tokens": ["frame_rocks", "particles_dust"]
      },
      "character": {
        "visible": true,
        "placement": { "x": 50, "y": 60, "scale": 0.5 },
        "pose": "standing_serious",
        "expression": "determined",
        "silhouette": false
      },
      "camera": {
        "movement": "slow_zoom_in",
        "focal_point": { "x": 50, "y": 55 },
        "intensity": "moderate"
      },
      "lighting": {
        "type": "directional",
        "direction": "top_left",
        "color": "#ffa040",
        "intensity": 0.6
      },
      "mood": "mysterious",
      "text_overlay": null
    }
  ]
}

IMPORTANT: Every word of the script must appear in exactly one scene. Use ONLY tokens from the lists above.`;

  const result = await generateJSON<{ scenes: CompositionBrief[] }>(prompt, 0.3);

  // Validate and sanitize tokens
  return result.scenes.map((scene) => sanitizeBrief(scene));
}

function sanitizeBrief(scene: CompositionBrief): CompositionBrief {
  // Clamp character placement to letterbox-safe bounds
  if (scene.character?.placement) {
    scene.character.placement.x = clamp(scene.character.placement.x, 8, 92);
    scene.character.placement.y = clamp(scene.character.placement.y, 30, 75);
    scene.character.placement.scale = clamp(scene.character.placement.scale, 0.25, 0.85);
  }

  // Validate tokens — strip any invalid ones
  if (scene.environment) {
    scene.environment.sky_tokens = filterValid(scene.environment.sky_tokens, VALID_SKY_TOKENS);
    scene.environment.far_tokens = filterValid(scene.environment.far_tokens, VALID_FAR_TOKENS);
    scene.environment.mid_tokens = filterValid(scene.environment.mid_tokens, VALID_MID_TOKENS);
    scene.environment.fg_tokens = filterValid(scene.environment.fg_tokens, VALID_FG_TOKENS);

    // Ensure at least one sky token
    if (scene.environment.sky_tokens.length === 0) {
      scene.environment.sky_tokens = ['gradient_night'];
    }
  }

  // Clamp lighting intensity
  if (scene.lighting) {
    scene.lighting.intensity = clamp(scene.lighting.intensity, 0.1, 1.0);
  }

  return scene;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function filterValid<T extends string>(arr: T[] | undefined, valid: T[]): T[] {
  if (!arr) return [];
  return arr.filter((t) => valid.includes(t));
}
