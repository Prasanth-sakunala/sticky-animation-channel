import { generateJSON } from './gemini.js';
import { classifyEmotions, emotionToMood, type EmotionArc } from './emotion-classifier.js';
import type { CompositionBrief } from './scene-director.js';

/**
 * Storyboard Engine — enhanced scene planning with:
 * - 3-act narrative structure awareness
 * - Emotion-driven mood assignment (via classifier)
 * - Character assignment per scene (from asset library)
 * - Pacing rhythm (tension/release cycles)
 * - Visual variety enforcement (no repeated backgrounds/cameras)
 */

export interface StoryboardResult {
  scenes: StoryboardScene[];
  emotion_arc: EmotionArc;
  act_structure: ActStructure;
  pacing_score: number; // 0-10
}

export interface StoryboardScene extends CompositionBrief {
  /** Assigned character for this scene */
  character_name: string;
  /** Act this scene belongs to (1, 2, or 3) */
  act: 1 | 2 | 3;
  /** Pacing beat type */
  beat: PacingBeat;
  /** Transition into this scene */
  transition: string;
  /** Emotion intensity at this point (from classifier) */
  emotion_intensity: number;
  /** Background asset name (resolved from asset library) */
  background_asset: string;
  /** Objects relevant to this scene */
  scene_objects: string[];
  /** Visual template used by the renderer */
  scene_type?: SceneType;
  /** Cinematic shot size/framing */
  shot_type?: ShotType;
  /** Short action cue inferred from narration */
  character_action?: CharacterAction;
}

export interface ActStructure {
  act1_end: number; // scene index where act 1 ends (~20% of scenes)
  act2_end: number; // scene index where act 2 ends (~75% of scenes)
  inciting_incident: number; // scene that kicks off the main conflict
  midpoint: number; // midpoint reversal/escalation
  climax: number; // highest stakes moment
  resolution: number; // wrap-up scene
}

export type PacingBeat =
  | 'hook' // Opening attention-grab
  | 'setup' // World/character establishment
  | 'escalation' // Rising tension
  | 'breather' // Brief release after tension
  | 'twist' // Unexpected turn
  | 'climax' // Peak intensity
  | 'resolution'; // Satisfying conclusion

export type SceneType =
  | 'narrator_bridge'
  | 'evidence_closeup'
  | 'location_establishing'
  | 'timeline_card'
  | 'case_board'
  | 'suspect_or_witness'
  | 'reveal_or_twist';

export type ShotType =
  | 'establishing'
  | 'wide'
  | 'medium'
  | 'close_up'
  | 'extreme_close_up'
  | 'pov';

export type CharacterAction =
  | 'narrating'
  | 'walking'
  | 'running'
  | 'looking'
  | 'thinking'
  | 'hiding'
  | 'pointing'
  | 'shocked'
  | 'afraid'
  | 'sad'
  | 'angry'
  | 'celebrating';

// Available characters from the asset library (must match extracted PNG folder names)
const AVAILABLE_CHARACTERS = {
  male: ['marcus', 'victor', 'leo', 'frank', 'rex_male', 'dev'],
  female: ['sara', 'diana', 'mia', 'ruth', 'jade', 'priya'],
  kids: ['tommy', 'jake', 'lily', 'zoe'],
  animals: ['buddy', 'shadow', 'rex_dog', 'whiskers', 'bear', 'fang', 'patches', 'crow'],
};

// Available backgrounds — these names are matched against keywords in the asset resolver
const AVAILABLE_BACKGROUNDS = [
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
];

// Available objects
const AVAILABLE_OBJECTS = [
  'obj01_knife', 'obj02_handgun', 'obj03_baseball_bat',
  'obj04_rope', 'obj05_axe', 'obj06_crowbar',
  'obj07_car_sedan', 'obj08_police_car', 'obj09_pickup_truck',
  'obj10_ambulance', 'obj11_smartphone', 'obj12_laptop',
  'obj13_envelope', 'obj14_landline_phone', 'obj15_flashlight',
  'obj16_key_ornate', 'obj17_bloody_handprint', 'obj18_diary',
  'obj19_photograph', 'obj20_locked_box', 'obj21_chair',
  'obj22_suitcase', 'obj23_clock', 'obj24_lamp',
  'obj25_mirror', 'obj26_money_stack', 'obj27_pill_bottle',
  'obj28_wedding_ring', 'obj29_backpack', 'obj30_teddy_bear',
  'obj31_fire_truck', 'obj32_newspaper', 'obj33_music_box', 'obj34_carved_bird',
];

const GENERIC_BACKGROUND_REPLACEMENTS: Record<string, string> = {
  generic_dark: 'bg39_police_station',
  generic_light: 'bg17_suburb_day',
  old_room: 'bg09_office_day',
  city_night: 'bg26_downtown_night',
  dark_forest: 'bg28_forest_night',
  snowy_mountain: 'bg31_mountain_cliff',
  laboratory: 'bg09_office_day',
  suburban_house: 'bg17_suburb_day',
  street: 'bg41_rainy_street_night',
};

const OBJECT_ALIASES: Record<string, string> = {
  question_mark: 'obj19_photograph',
  exclamation: 'obj32_newspaper',
  magnifying_glass: 'obj15_flashlight',
  footprints: 'obj17_bloody_handprint',
  flashlight_beam: 'obj15_flashlight',
  book: 'obj18_diary',
  journal: 'obj18_diary',
  diary: 'obj18_diary',
  letter: 'obj13_envelope',
  envelope: 'obj13_envelope',
  photograph: 'obj19_photograph',
  photo: 'obj19_photograph',
  newspaper: 'obj32_newspaper',
  clock: 'obj23_clock',
  key: 'obj16_key_ornate',
  phone: 'obj14_landline_phone',
  landline_phone: 'obj14_landline_phone',
  flashlight: 'obj15_flashlight',
  suitcase: 'obj22_suitcase',
  locked_box: 'obj20_locked_box',
  box: 'obj20_locked_box',
  ring: 'obj28_wedding_ring',
  gun: 'obj02_handgun',
  knife: 'obj01_knife',
  rope: 'obj04_rope',
  car: 'obj07_car_sedan',
  police_car: 'obj08_police_car',
  fire: 'obj32_newspaper',
  skull: 'obj17_bloody_handprint',
  snow_particles: 'obj19_photograph',
};

export async function generateStoryboard(
  script: string,
  title: string,
  category: string = 'mystery'
): Promise<StoryboardResult> {
  // Step 1: Run emotion classifier in parallel with scene breakdown
  const [emotionArc, rawScenes] = await Promise.all([
    classifyEmotions(script),
    generateSceneBreakdown(script, title, category),
  ]);

  // Step 2: Assign acts and pacing beats based on emotion arc
  const actStructure = determineActStructure(rawScenes.length, emotionArc);

  // Step 3: Enrich scenes with emotion data + character assignment + visual variety
  const enriched = enrichScenes(rawScenes, emotionArc, actStructure);

  // Step 4: Enforce concrete mystery visuals before rendering
  const concrete = enforceMysteryVisuals(enriched);

  // Step 5: Enforce visual variety (no repeated cameras in sequence)
  const varied = enforceVisualVariety(concrete);

  // Step 6: Score pacing quality
  const pacingScore = scorePacing(varied, actStructure);

  return {
    scenes: varied,
    emotion_arc: emotionArc,
    act_structure: actStructure,
    pacing_score: pacingScore,
  };
}

/** Generate raw scene breakdown with character/background assignments */
async function generateSceneBreakdown(
  script: string,
  title: string,
  category: string
): Promise<StoryboardScene[]> {
  const prompt = `You are a storyboard artist for animated YouTube stories. Break this script into visual scenes.

TITLE: ${title}
CATEGORY: ${category}
SCRIPT:
"""
${script}
"""

AVAILABLE CHARACTERS:
- Male: ${AVAILABLE_CHARACTERS.male.join(', ')}
- Female: ${AVAILABLE_CHARACTERS.female.join(', ')}
- Kids: ${AVAILABLE_CHARACTERS.kids.join(', ')}
- Animals: ${AVAILABLE_CHARACTERS.animals.join(', ')}

AVAILABLE BACKGROUNDS: ${AVAILABLE_BACKGROUNDS.join(', ')}

AVAILABLE OBJECTS: ${AVAILABLE_OBJECTS.join(', ')}

═══════════════════════════════════════
CRITICAL RULES — READ CAREFULLY:
═══════════════════════════════════════

CHARACTER ASSIGNMENT (MOST IMPORTANT):
- First, identify all PEOPLE/CHARACTERS mentioned in the story (e.g., "a man", "his wife", "the detective", "a little girl")
- Assign ONE specific visual character to each story person and KEEP IT CONSISTENT for the ENTIRE video
- Example: If story has "a man and his wife" → assign marcus to the man, sara to the wife. Use marcus in EVERY scene where the man appears, sara in EVERY scene where the wife appears.
- The character shown in each scene MUST be the person who is speaking or being featured in that scene's narration
- If narration is about "he walked into the forest" and "he" = marcus, then character_name = "marcus"
- NEVER randomly switch characters — they represent specific people in the story

OBJECTS (ONLY RELEVANT ONES):
- ONLY include objects that are DIRECTLY mentioned or clearly implied in that scene's narration text
- If the narration says "he picked up the knife" → scene_objects: ["knife"]
- If the narration says "the clock struck midnight" → scene_objects: ["clock"]
- If the narration says "she walked down the street" → scene_objects: [] (no objects mentioned!)
- NEVER add random objects just to fill the scene. Empty array [] is perfectly fine.
- Maximum 2 objects per scene, only if both are mentioned/implied

BACKGROUNDS:
- Pick from AVAILABLE BACKGROUNDS based on WHERE the scene takes place
- Match the actual location described in narration (kitchen = kitchen, forest = forest, etc.)
- Use varied backgrounds — don't repeat the same one for every scene
- Match the tone: bright scenes for happy moments, darker for tense moments

PLACEMENT:
- Character placement should match the action:
  - Speaking/standing: center (x:50, y:60)
  - Walking away: off-center (x:30 or x:70, y:60)
  - Looking at something: facing the direction (x:35, y:55) or (x:65, y:55)
  - Scared/hiding: lower position (x:50, y:70, scale:0.4)
  - Confident/powerful: larger (x:50, y:55, scale:0.6)

SCENE BREAKDOWN:
- Each scene = 3-8 seconds narration (8-20 words)
- Every word of the script must appear in exactly one scene
- DO NOT output any "environment" or "palette" field

POSE & EXPRESSION must match the emotion:
- Happy/excited → pose: standing_happy or jumping_happy, expression: happy/excited
- Scared → pose: crouching_scared or running_scared, expression: scared
- Angry → pose: arms_crossed_angry, expression: angry
- Sad → pose: sitting_sad, expression: sad
- Neutral/narrating → pose: standing_neutral, expression: neutral or determined

Output JSON:
{
  "character_map": {
    "the man": "marcus",
    "his wife": "sara",
    "the detective": "victor"
  },
  "scenes": [
    {
      "scene_id": 1,
      "narration_text": "exact text from script",
      "duration_estimate": 5,
      "character_name": "marcus",
      "background_asset": "suburban_house",
      "scene_objects": ["key"],
      "character": {
        "visible": true,
        "name": "marcus",
        "placement": { "x": 50, "y": 60, "scale": 0.5 },
        "pose": "standing_neutral",
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
}`;

  const result = await generateJSON<{ scenes: StoryboardScene[]; character_map?: Record<string, string> }>(prompt, 0.4);
  return result.scenes || [];
}

/** Determine 3-act structure from scene count and emotion arc */
function determineActStructure(sceneCount: number, arc: EmotionArc): ActStructure {
  // Standard 3-act timing: 20% / 55% / 25%
  const act1End = Math.max(1, Math.floor(sceneCount * 0.2));
  const act2End = Math.max(act1End + 1, Math.floor(sceneCount * 0.75));

  // Find inciting incident — first major intensity spike after opening
  let incitingIncident = act1End;
  for (let i = 1; i < Math.min(arc.sentences.length, act1End + 3); i++) {
    if (arc.sentences[i]?.intensity > 0.6) {
      incitingIncident = i;
      break;
    }
  }

  // Midpoint — middle of act 2
  const midpoint = Math.floor((act1End + act2End) / 2);

  // Climax — use emotion arc's climax or default to late act 2
  const climax = Math.min(arc.climax_index, sceneCount - 2);

  return {
    act1_end: act1End,
    act2_end: act2End,
    inciting_incident: incitingIncident,
    midpoint,
    climax: Math.max(climax, act2End - 1),
    resolution: sceneCount - 1,
  };
}

/** Assign pacing beats based on position in act structure */
function assignBeat(sceneIdx: number, acts: ActStructure, totalScenes: number): PacingBeat {
  if (sceneIdx === 0) return 'hook';
  if (sceneIdx <= acts.act1_end && sceneIdx < acts.inciting_incident) return 'setup';
  if (sceneIdx === acts.inciting_incident) return 'escalation';
  if (sceneIdx === acts.midpoint) return 'twist';
  if (sceneIdx === acts.climax) return 'climax';
  if (sceneIdx >= acts.act2_end) return 'resolution';

  // Within act 2: alternate escalation and breathers
  // Every 3-4 scenes of escalation should have a breather
  const posInAct2 = sceneIdx - acts.act1_end;
  if (posInAct2 > 0 && posInAct2 % 4 === 0) return 'breather';
  return 'escalation';
}

/** Assign scene transition based on pacing beat */
function assignTransition(beat: PacingBeat, sceneIndex: number): string {
  if (sceneIndex === 0) return 'cut'; // First scene — instant
  switch (beat) {
    case 'hook': return 'cut';
    case 'setup': return 'dissolve';
    case 'escalation': return 'fade';
    case 'breather': return 'dissolve';
    case 'twist': return 'glitch';
    case 'climax': return 'whip_pan';
    case 'resolution': return 'blur';
    default: return 'fade';
  }
}

/** Enrich scenes with emotion-driven moods, acts, and beats */
function enrichScenes(
  scenes: StoryboardScene[],
  arc: EmotionArc,
  acts: ActStructure
): StoryboardScene[] {
  // Map sentences to scenes (approximate — scenes may span multiple sentences)
  let sentenceIdx = 0;

  return scenes.map((scene, i) => {
    const beat = assignBeat(i, acts, scenes.length);

    // Find matching emotion segment for this scene's text
    const sceneWords = scene.narration_text.split(/\s+/).length;
    let sceneIntensity = 0.5;
    let sceneMood = scene.mood;

    // Find the emotion segment that covers this scene's position
    const sentenceCount = Math.max(1, Math.ceil(sceneWords / 8)); // ~8 words per sentence
    const matchingSentences = arc.sentences.slice(sentenceIdx, sentenceIdx + sentenceCount);
    sentenceIdx += sentenceCount;

    if (matchingSentences.length > 0) {
      sceneIntensity = matchingSentences.reduce((sum, s) => sum + s.intensity, 0) / matchingSentences.length;
      // Use emotion-derived mood if stronger than AI's assignment
      const emotionMood = emotionToMood(matchingSentences[0].primary_emotion);
      if (matchingSentences[0].intensity > 0.6) {
        sceneMood = emotionMood as any;
      }
    }

    // Override mood for specific beats
    if (beat === 'hook') sceneMood = 'dramatic' as any;
    if (beat === 'climax') sceneMood = 'dramatic' as any;
    if (beat === 'breather') sceneMood = 'calm' as any;

    // Determine act
    let act: 1 | 2 | 3 = 2;
    if (i <= acts.act1_end) act = 1;
    else if (i > acts.act2_end) act = 3;

    // Adjust camera intensity based on beat
    let cameraIntensity = scene.camera?.intensity || 'moderate';
    if (beat === 'climax' || beat === 'twist') cameraIntensity = 'dramatic';
    if (beat === 'breather' || beat === 'setup') cameraIntensity = 'subtle';

    // Assign transition based on beat
    const transition = assignTransition(beat, i);

    return {
      ...scene,
      act,
      beat,
      transition,
      emotion_intensity: sceneIntensity,
      mood: sceneMood,
      camera: {
        ...scene.camera,
        intensity: cameraIntensity,
      },
    };
  });
}

/** Ensure camera movements aren't repetitive (backgrounds are intentional — don't override) */
export function enforceMysteryVisuals(scenes: StoryboardScene[]): StoryboardScene[] {
  return scenes.map((scene, index) => {
    const sceneType = classifySceneType(scene, index);
    const narration = scene.narration_text || '';
    const shotType = classifyShotType(scene, sceneType, index);
    const characterAction = classifyCharacterAction(narration);
    const background = resolveConcreteBackground(scene.background_asset, narration, sceneType);
    const objects = resolveConcreteObjects(scene.scene_objects || [], narration, sceneType).slice(0, 3);
    const textOverlay = scene.text_overlay || buildTextOverlay(scene, sceneType, index);
    const character = buildSceneTypeCharacter(scene, sceneType, objects, shotType, characterAction, index);
    const camera = buildSceneTypeCamera(scene, sceneType, shotType, index);
    const transition = buildSceneTypeTransition(scene, sceneType, index);

    return {
      ...scene,
      scene_type: sceneType,
      shot_type: shotType,
      character_action: characterAction,
      background_asset: background,
      scene_objects: objects,
      text_overlay: textOverlay,
      character,
      character_name: character.visible ? scene.character_name || 'marcus' : '',
      camera,
      transition,
    };
  });
}

function classifySceneType(scene: StoryboardScene, index: number): SceneType {
  const text = (scene.narration_text || '').toLowerCase();

  if (index === 0 || scene.beat === 'hook') return 'reveal_or_twist';
  if (scene.beat === 'twist' || scene.beat === 'climax') return 'reveal_or_twist';
  if (/\b(19|20)\d{2}\b|january|february|march|april|may|june|july|august|september|october|november|december|years? later|days? later|hours? later/.test(text)) {
    return 'timeline_card';
  }
  if (/newspaper|report|file|case|evidence|clue|letter|note|diary|photo|photograph|envelope|phone|call|key|box|suitcase|ring|handprint|weapon|knife|gun|rope/.test(text)) {
    return 'evidence_closeup';
  }
  if (/police|detective|witness|suspect|family|wife|husband|man|woman|boy|girl|officer/.test(text)) {
    return 'suspect_or_witness';
  }
  if (/forest|woods|street|road|house|room|office|court|grave|cemetery|mountain|tunnel|lake|beach|city|alley|station|hospital|prison|warehouse/.test(text)) {
    return 'location_establishing';
  }
  if (index % 5 === 0) return 'case_board';
  return 'narrator_bridge';
}

function classifyShotType(scene: StoryboardScene, sceneType: SceneType, index: number): ShotType {
  if (sceneType === 'location_establishing') return 'establishing';
  if (sceneType === 'evidence_closeup') return index % 3 === 0 ? 'extreme_close_up' : 'close_up';
  if (sceneType === 'timeline_card' || sceneType === 'case_board') return 'pov';
  if (sceneType === 'reveal_or_twist') return 'close_up';
  if (sceneType === 'suspect_or_witness') return index % 2 === 0 ? 'medium' : 'close_up';
  return index % 4 === 0 ? 'wide' : 'medium';
}

function classifyCharacterAction(narration: string): CharacterAction {
  const text = narration.toLowerCase();
  if (/\b(run|ran|rush|rushed|flee|fled|escape|escaped)\b/.test(text)) return 'running';
  if (/\b(walk|walked|step|stepped|climb|climbed|travel|traveled|leave|left)\b/.test(text)) return 'walking';
  if (/\b(look|looked|saw|see|watch|watched|search|searched)\b/.test(text)) return 'looking';
  if (/\b(think|thought|wonder|question|confused|realized)\b/.test(text)) return 'thinking';
  if (/\b(hide|hid|hiding|crouch|crouched|behind)\b/.test(text)) return 'hiding';
  if (/\b(point|pointed|show|showed|revealed)\b/.test(text)) return 'pointing';
  if (/\b(shock|shocked|stunned|suddenly|scream|screamed)\b/.test(text)) return 'shocked';
  if (/\b(fear|afraid|scared|terrified|panic|panicked)\b/.test(text)) return 'afraid';
  if (/\b(sad|cry|cried|grief|loss|lost|alone)\b/.test(text)) return 'sad';
  if (/\b(angry|rage|furious|fight|fought)\b/.test(text)) return 'angry';
  if (/\b(happy|smile|celebrate|relief|saved)\b/.test(text)) return 'celebrating';
  return 'narrating';
}

function resolveConcreteBackground(background: string | undefined, narration: string, sceneType: SceneType): string {
  const normalized = normalizeKey(background);
  if (normalized && AVAILABLE_BACKGROUNDS.includes(normalized)) return normalized;

  const text = narration.toLowerCase();
  const keywordMatches: Array<[RegExp, string]> = [
    [/police|detective|station|case file|report/, 'bg39_police_station'],
    [/court|judge|trial|legal/, 'bg38_courtroom'],
    [/grave|cemetery|buried|dead|body/, 'bg37_graveyard_night'],
    [/rain|storm|street|night road/, 'bg41_rainy_street_night'],
    [/alley|backstreet/, 'bg19_alley_night'],
    [/tunnel|underground/, 'bg40_tunnel'],
    [/prison|cell|jail/, 'bg36_prison_cell'],
    [/warehouse|abandoned/, 'bg35_warehouse'],
    [/mountain|cliff|pass|snow/, 'bg31_mountain_cliff'],
    [/forest|woods|fog/, 'bg43_foggy_forest'],
    [/lake|river|water/, 'bg29_lake'],
    [/hospital|doctor|medical/, 'bg11_hospital_room'],
    [/office|desk|file/, 'bg09_office_day'],
    [/house|home|suburb|neighborhood/, 'bg18_suburb_night'],
    [/city|downtown/, 'bg26_downtown_night'],
    [/gas station/, 'bg24_gas_station_night'],
  ];

  for (const [pattern, asset] of keywordMatches) {
    if (pattern.test(text)) return asset;
  }

  if (normalized && GENERIC_BACKGROUND_REPLACEMENTS[normalized]) return GENERIC_BACKGROUND_REPLACEMENTS[normalized];

  switch (sceneType) {
    case 'evidence_closeup':
    case 'case_board':
      return 'bg09_office_day';
    case 'timeline_card':
      return 'bg39_police_station';
    case 'reveal_or_twist':
      return 'bg41_rainy_street_night';
    case 'suspect_or_witness':
      return 'bg39_police_station';
    case 'location_establishing':
      return 'bg26_downtown_night';
    default:
      return 'bg17_suburb_day';
  }
}

function resolveConcreteObjects(objects: string[], narration: string, sceneType: SceneType): string[] {
  const resolved = new Set<string>();
  for (const object of objects) {
    const normalized = normalizeKey(object);
    if (!normalized) continue;
    if (AVAILABLE_OBJECTS.includes(normalized)) resolved.add(normalized);
    else if (OBJECT_ALIASES[normalized]) resolved.add(OBJECT_ALIASES[normalized]);
  }

  const text = narration.toLowerCase();
  const keywordMatches: Array<[RegExp, string]> = [
    [/\b(newspaper|headline|article|press)\b/, 'obj32_newspaper'],
    [/\b(photo|photograph|picture|portrait)\b/, 'obj19_photograph'],
    [/\b(diary|journal|book|notebook)\b/, 'obj18_diary'],
    [/\b(letter|note|envelope|mail)\b/, 'obj13_envelope'],
    [/\b(phone|call|rang|telephone)\b/, 'obj14_landline_phone'],
    [/\b(key|locked|lock)\b/, 'obj16_key_ornate'],
    [/\b(box|chest|container)\b/, 'obj20_locked_box'],
    [/\b(suitcase|bag|luggage)\b/, 'obj22_suitcase'],
    [/\b(clock|time|midnight|hour)\b/, 'obj23_clock'],
    [/\b(ring|wedding)\b/, 'obj28_wedding_ring'],
    [/\b(handprint|blood|bloody|fingerprint)\b/, 'obj17_bloody_handprint'],
    [/\b(flashlight|torch|dark)\b/, 'obj15_flashlight'],
    [/\b(police car|patrol)\b/, 'obj08_police_car'],
    [/\b(car|vehicle|sedan)\b/, 'obj07_car_sedan'],
    [/\b(knife|blade)\b/, 'obj01_knife'],
    [/\b(gun|pistol|handgun)\b/, 'obj02_handgun'],
    [/\b(rope|tied|bound)\b/, 'obj04_rope'],
    [/\b(money|cash)\b/, 'obj26_money_stack'],
  ];

  for (const [pattern, asset] of keywordMatches) {
    if (pattern.test(text)) resolved.add(asset);
  }

  if (resolved.size === 0) {
    if (sceneType === 'timeline_card') resolved.add('obj32_newspaper');
    if (sceneType === 'case_board') {
      resolved.add('obj32_newspaper');
      resolved.add('obj19_photograph');
    }
    if (sceneType === 'evidence_closeup' || sceneType === 'reveal_or_twist') resolved.add('obj19_photograph');
  }

  return [...resolved];
}

function buildTextOverlay(scene: StoryboardScene, sceneType: SceneType, index: number): string | null {
  const text = scene.narration_text || '';
  const year = text.match(/\b(19|20)\d{2}\b/)?.[0];
  if (year) return year;
  if (index === 0) return 'THE CASE BEGINS';

  switch (sceneType) {
    case 'evidence_closeup':
      return 'THE CLUE';
    case 'timeline_card':
      return 'TIMELINE';
    case 'case_board':
      return 'CASE FILE';
    case 'reveal_or_twist':
      return scene.beat === 'climax' ? 'THE TURNING POINT' : 'WHAT HAPPENED?';
    default:
      return null;
  }
}

function buildSceneTypeCharacter(
  scene: StoryboardScene,
  sceneType: SceneType,
  objects: string[],
  shotType: ShotType,
  action: CharacterAction,
  index: number
): StoryboardScene['character'] {
  const base = scene.character || {
    visible: true,
    placement: { x: 50, y: 60, scale: 0.5 },
    pose: 'standing_neutral' as const,
    expression: 'neutral' as const,
    silhouette: false,
  };

  if (sceneType === 'evidence_closeup' || sceneType === 'timeline_card' || sceneType === 'case_board') {
    return {
      ...base,
      visible: false,
    };
  }

  if (sceneType === 'location_establishing') {
    return {
      ...base,
      visible: true,
      placement: pickPlacement(index, shotType, action),
      pose: poseForAction(action) as any,
      expression: expressionForAction(action) as any,
      silhouette: true,
    };
  }

  if (sceneType === 'suspect_or_witness') {
    return {
      ...base,
      visible: true,
      placement: pickPlacement(index, shotType, action),
      pose: poseForAction(action) as any,
      expression: expressionForAction(action) as any,
      silhouette: scene.beat === 'twist' || scene.beat === 'climax',
    };
  }

  if (sceneType === 'reveal_or_twist' && objects.length > 0) {
    return {
      ...base,
      visible: false,
    };
  }

  return {
    ...base,
    visible: true,
    placement: pickPlacement(index, shotType, action),
    pose: poseForAction(action) as any,
    expression: expressionForAction(action) as any,
  };
}

function pickPlacement(index: number, shotType: ShotType, action: CharacterAction): { x: number; y: number; scale: number } {
  const side = index % 2 === 0 ? 34 : 66;
  if (shotType === 'establishing') return { x: side, y: 66, scale: 0.24 };
  if (shotType === 'wide') return { x: side, y: 65, scale: 0.34 };
  if (shotType === 'close_up') return { x: side, y: 60, scale: 0.64 };
  if (shotType === 'extreme_close_up') return { x: side, y: 58, scale: 0.76 };
  if (action === 'hiding') return { x: side, y: 70, scale: 0.38 };
  if (action === 'running') return { x: index % 2 === 0 ? 28 : 72, y: 63, scale: 0.46 };
  return { x: side, y: 62, scale: 0.48 };
}

function poseForAction(action: CharacterAction): string {
  switch (action) {
    case 'walking': return 'walking_neutral';
    case 'running': return 'running_scared';
    case 'looking': return 'looking_back_scared';
    case 'thinking': return 'sitting_neutral';
    case 'hiding': return 'crouching_scared';
    case 'pointing': return 'pointing_excited';
    case 'shocked': return 'hands_up_surprised';
    case 'afraid': return 'standing_scared';
    case 'sad': return 'sitting_sad';
    case 'angry': return 'arms_crossed_angry';
    case 'celebrating': return 'standing_happy';
    default: return 'standing_neutral';
  }
}

function expressionForAction(action: CharacterAction): string {
  switch (action) {
    case 'running':
    case 'hiding':
    case 'afraid': return 'scared';
    case 'looking':
    case 'thinking': return 'confused';
    case 'pointing':
    case 'shocked': return 'surprised';
    case 'sad': return 'sad';
    case 'angry': return 'angry';
    case 'celebrating': return 'happy';
    default: return 'determined';
  }
}

function buildSceneTypeCamera(scene: StoryboardScene, sceneType: SceneType, shotType: ShotType, index: number): StoryboardScene['camera'] {
  const base = scene.camera || {
    movement: 'slow_zoom_in' as const,
    focal_point: { x: 50, y: 55 },
    intensity: 'moderate' as const,
  };

  const movementByType: Record<SceneType, Array<StoryboardScene['camera']['movement']>> = {
    narrator_bridge: ['slow_zoom_in', 'slow_zoom_out', 'drift_up'],
    evidence_closeup: ['push_in', 'dolly_in', 'slow_zoom_in'],
    location_establishing: ['pan_left', 'pan_right', 'drift_up', 'crane_up'],
    timeline_card: ['push_in', 'slow_zoom_in'],
    case_board: ['push_in', 'pan_right', 'dolly_in'],
    suspect_or_witness: ['slow_zoom_in', 'pull_back', 'pan_left'],
    reveal_or_twist: ['push_in', 'shake', 'dolly_in'],
  };

  const options = movementByType[sceneType];
  const movement = scene.beat === 'climax'
    ? 'shake'
    : options[index % options.length];

  return {
    ...base,
    movement,
    focal_point: sceneType === 'evidence_closeup' || sceneType === 'case_board' || shotType === 'pov'
      ? { x: 50, y: 58 }
      : { x: index % 2 === 0 ? 38 : 62, y: shotType === 'establishing' ? 52 : 58 },
    intensity: scene.beat === 'climax' || scene.beat === 'twist' || sceneType === 'reveal_or_twist'
      ? 'dramatic'
      : base.intensity || 'moderate',
  };
}

function buildSceneTypeTransition(scene: StoryboardScene, sceneType: SceneType, index: number): string {
  if (index === 0) return 'cut';
  if (scene.beat === 'climax') return 'whip_pan';
  if (scene.beat === 'twist' || sceneType === 'reveal_or_twist') return 'glitch';
  if (sceneType === 'timeline_card' || sceneType === 'case_board') return 'dissolve';
  if (sceneType === 'evidence_closeup') return 'zoom_in';
  if (sceneType === 'location_establishing') return 'fade';
  return scene.transition === 'cut' ? 'fade' : scene.transition || 'fade';
}

function normalizeKey(value: string | undefined): string {
  return (value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

function enforceVisualVariety(scenes: StoryboardScene[]): StoryboardScene[] {
  for (let i = 1; i < scenes.length; i++) {
    const prev = scenes[i - 1];
    const curr = scenes[i];

    // Only enforce camera variety — background stays as Gemini assigned
    // (if the story takes place in one room, the background SHOULD repeat)
    if (curr.camera?.movement === prev.camera?.movement) {
      const cameraOptions: Array<typeof curr.camera.movement> = ['static', 'slow_zoom_in', 'slow_zoom_out', 'pan_left', 'pan_right', 'drift_up', 'dolly_in', 'orbit', 'push_in', 'pull_back', 'tilt_up', 'crane_up'];
      const filtered = cameraOptions.filter((c) => c !== curr.camera.movement);
      curr.camera.movement = filtered[i % filtered.length];
    }
  }
  return scenes;
}

/** Score overall pacing quality (0-10) */
function scorePacing(scenes: StoryboardScene[], acts: ActStructure): number {
  let score = 10;

  // Penalize if no breathers (all escalation = exhausting)
  const breatherCount = scenes.filter((s) => s.beat === 'breather').length;
  if (breatherCount === 0 && scenes.length > 6) score -= 2;

  // Penalize if climax is too early
  if (acts.climax < scenes.length * 0.5) score -= 1;

  // Penalize if first scene isn't a hook
  if (scenes[0]?.beat !== 'hook') score -= 1;

  // Penalize monotone intensity (no variation)
  const intensities = scenes.map((s) => s.emotion_intensity);
  const intensityRange = Math.max(...intensities) - Math.min(...intensities);
  if (intensityRange < 0.3) score -= 2;

  // Reward good tension/release ratio
  const escalationRatio = scenes.filter((s) => s.beat === 'escalation').length / scenes.length;
  if (escalationRatio > 0.3 && escalationRatio < 0.6) score += 1;

  return Math.max(1, Math.min(10, score));
}
