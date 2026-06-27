import { staticFile } from 'remotion';

// ─── CHARACTER NAMES ──────────────────────────────────────────────────────────

export const MALE_CHARACTERS = ['marcus', 'victor', 'leo', 'frank', 'rex_male', 'dev'] as const;
export const FEMALE_CHARACTERS = ['sara', 'diana', 'mia', 'ruth', 'jade', 'priya'] as const;
export const KID_CHARACTERS = ['tommy', 'jake', 'lily', 'zoe'] as const;
export const ANIMAL_CHARACTERS = ['buddy', 'shadow', 'rex_dog', 'whiskers', 'bear', 'fang', 'patches', 'crow'] as const;

export const ALL_CHARACTERS = [
  ...MALE_CHARACTERS,
  ...FEMALE_CHARACTERS,
  ...KID_CHARACTERS,
  ...ANIMAL_CHARACTERS,
] as const;

export type CharacterName = (typeof ALL_CHARACTERS)[number];

// ─── POSE NAMES ───────────────────────────────────────────────────────────────

export const HUMAN_POSES = [
  'standing_neutral',
  'standing_happy',
  'standing_angry',
  'standing_scared',
  'standing_side_neutral',
  'sitting_sad',
  'sitting_neutral',
  'walking_neutral',
  'running_scared',
  'pointing_excited',
  'arms_crossed_angry',
  'crouching_scared',
  'looking_back_scared',
  'hands_up_surprised',
  'hugging_self_sad',
  'jumping_happy',
] as const;

export const ANIMAL_POSES = [
  'sitting_neutral',
  'sitting_happy',
  'standing_aggressive',
  'standing_scared',
  'side_neutral',
  'lying_sad',
  'lying_sleeping',
  'walking_neutral',
  'running_aggressive',
  'running_scared',
  'sitting_alert',
  'crouching_stalking',
  'looking_back',
  'barking_howling',
  'playful_happy',
  'defensive_stance',
] as const;

export type HumanPose = (typeof HUMAN_POSES)[number];
export type AnimalPose = (typeof ANIMAL_POSES)[number];
export type PoseName = HumanPose | AnimalPose;

// ─── BACKGROUND NAMES ─────────────────────────────────────────────────────────

export const BACKGROUNDS = [
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
] as const;

export type BackgroundName = (typeof BACKGROUNDS)[number];

// ─── OBJECT NAMES ─────────────────────────────────────────────────────────────

export const OBJECTS = [
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
] as const;

export type ObjectName = (typeof OBJECTS)[number];

// ─── RESOLVER FUNCTIONS ───────────────────────────────────────────────────────

/**
 * Resolve a character + pose to a staticFile path for Remotion <Img>
 */
export function resolveCharacter(character: CharacterName, pose: PoseName): string {
  return staticFile(`assets/characters/${character}/${pose}.png`);
}

/**
 * Resolve a background name to a staticFile path
 */
export function resolveBackground(name: string): string {
  return staticFile(`assets/backgrounds/${name}.png`);
}

/**
 * Resolve an object name to a staticFile path
 */
export function resolveObject(name: string): string {
  return staticFile(`assets/objects/${name}.png`);
}

// ─── POSE MAPPING ─────────────────────────────────────────────────────────────

/**
 * Map old pose names (from existing pipeline) to new extracted pose names
 */
const LEGACY_POSE_MAP: Record<string, HumanPose> = {
  'standing_neutral': 'standing_neutral',
  'standing_serious': 'standing_neutral',
  'standing_excited': 'standing_happy',
  'sitting_thinking': 'sitting_neutral',
  'pointing_left': 'pointing_excited',
  'pointing_right': 'pointing_excited',
  'hands_up': 'hands_up_surprised',
  'arms_crossed': 'arms_crossed_angry',
  'crouching': 'crouching_scared',
  'walking': 'walking_neutral',
};

/**
 * Map a legacy pose or expression combo to the best matching extracted pose
 */
export function mapToPose(pose: string, expression?: string): PoseName {
  // Direct match — already a valid pose name
  if (HUMAN_POSES.includes(pose as HumanPose)) return pose as HumanPose;
  if (ANIMAL_POSES.includes(pose as AnimalPose)) return pose as AnimalPose;

  // Expression-aware mapping for standing poses
  if (pose === 'standing_neutral' || pose === 'standing_serious' || pose === 'standing_excited') {
    if (expression === 'happy' || expression === 'excited') return 'standing_happy';
    if (expression === 'angry' || expression === 'determined') return 'standing_angry';
    if (expression === 'scared') return 'standing_scared';
    if (expression === 'sad') return 'standing_neutral';
  }

  // Legacy pose name mapping
  if (pose in LEGACY_POSE_MAP) return LEGACY_POSE_MAP[pose];

  // Fallback
  return 'standing_neutral';
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

export function isAnimal(character: CharacterName): boolean {
  return (ANIMAL_CHARACTERS as readonly string[]).includes(character);
}

export function getDefaultPose(character: CharacterName): PoseName {
  return isAnimal(character) ? 'sitting_neutral' : 'standing_neutral';
}

/**
 * Map background description keywords to a background asset name
 */
const BG_KEYWORD_MAP: Record<string, BackgroundName> = {
  'living_room': 'bg01_living_room_day',
  'living room': 'bg01_living_room_day',
  'cozy': 'bg01_living_room_day',
  'interior': 'bg01_living_room_day',
  'bedroom': 'bg03_bedroom_night',
  'kitchen': 'bg04_kitchen_day',
  'basement': 'bg05_basement',
  'hallway': 'bg06_hallway_night',
  'garage': 'bg07_garage',
  'attic': 'bg08_attic',
  'office': 'bg09_office_day',
  'classroom': 'bg10_classroom',
  'school': 'bg10_classroom',
  'hospital': 'bg11_hospital_room',
  'store': 'bg12_convenience_store',
  'shop': 'bg12_convenience_store',
  'charity': 'bg12_convenience_store',
  'diner': 'bg13_diner',
  'restaurant': 'bg13_diner',
  'bar': 'bg14_bar_night',
  'church': 'bg15_church',
  'gym': 'bg16_gym',
  'suburb': 'bg17_suburb_day',
  'street': 'bg17_suburb_day',
  'neighborhood': 'bg17_suburb_day',
  'alley': 'bg19_alley_night',
  'parking': 'bg20_parking_lot_night',
  'park': 'bg21_park_day',
  'rooftop': 'bg22_rooftop_night',
  'bridge': 'bg23_bridge_night',
  'gas_station': 'bg24_gas_station_night',
  'highway': 'bg25_highway_day',
  'road': 'bg25_highway_day',
  'city': 'bg26_downtown_night',
  'downtown': 'bg26_downtown_night',
  'forest': 'bg27_forest_day',
  'woods': 'bg27_forest_day',
  'lake': 'bg29_lake',
  'pond': 'bg29_lake',
  'river': 'bg29_lake',
  'field': 'bg30_field_day',
  'meadow': 'bg30_field_day',
  'mountain': 'bg31_mountain_cliff',
  'cliff': 'bg31_mountain_cliff',
  'cave': 'bg32_cave',
  'beach': 'bg33_beach',
  'ocean': 'bg33_beach',
  'swamp': 'bg34_swamp',
  'warehouse': 'bg35_warehouse',
  'abandoned': 'bg35_warehouse',
  'prison': 'bg36_prison_cell',
  'jail': 'bg36_prison_cell',
  'graveyard': 'bg37_graveyard_night',
  'cemetery': 'bg37_graveyard_night',
  'courtroom': 'bg38_courtroom',
  'court': 'bg38_courtroom',
  'police': 'bg39_police_station',
  'tunnel': 'bg40_tunnel',
  'rain': 'bg41_rainy_street_night',
  'rainy': 'bg41_rainy_street_night',
  'snow': 'bg42_snowy_suburb',
  'snowy': 'bg42_snowy_suburb',
  'fog': 'bg43_foggy_forest',
  'foggy': 'bg43_foggy_forest',
  'storm': 'bg44_stormy_beach',
  'sunset': 'bg45_sunset_field',
  'overcast': 'bg46_overcast_city',
};

/**
 * Resolve a background description from the script to the best matching asset.
 * Falls back to suburb_day if no match.
 */
export function resolveBackgroundFromDescription(description: string): string {
  const lower = (description || '').toLowerCase();

  if ((BACKGROUNDS as readonly string[]).includes(description)) {
    return staticFile(`assets/backgrounds/${description}.png`);
  }

  // Check for night variants
  const isNight = lower.includes('night') || lower.includes('dark') || lower.includes('evening');

  // Find matching keyword
  for (const [keyword, bgName] of Object.entries(BG_KEYWORD_MAP)) {
    if (lower.includes(keyword)) {
      // If night requested and a night variant exists, use it
      if (isNight) {
        if (bgName === 'bg01_living_room_day') return staticFile('assets/backgrounds/bg02_living_room_night.png');
        if (bgName === 'bg17_suburb_day') return staticFile('assets/backgrounds/bg18_suburb_night.png');
        if (bgName === 'bg27_forest_day') return staticFile('assets/backgrounds/bg28_forest_night.png');
      }
      return staticFile(`assets/backgrounds/${bgName}.png`);
    }
  }

  // Fallback
  return staticFile('assets/backgrounds/bg17_suburb_day.png');
}
