export type CameraMovement = 'static' | 'slow_zoom_in' | 'slow_zoom_out' | 'pan_left' | 'pan_right' | 'drift_up' | 'shake' | 'dolly_in' | 'orbit' | 'push_in' | 'pull_back' | 'tilt_up' | 'tilt_down' | 'crane_up';
export type TransitionType = 'cut' | 'fade' | 'slide_left' | 'dissolve' | 'wipe_right' | 'zoom_in' | 'blur' | 'glitch' | 'whip_pan';
export type MouthShape = 'closed' | 'open_small' | 'open_wide';
export type CharacterExpression = 'neutral' | 'surprised' | 'thinking' | 'scared' | 'excited' | 'confused' | 'angry' | 'happy' | 'determined' | 'sad';

// Legacy pose type (kept for backward compat with existing scenes)
export type CharacterPose = 'standing_neutral' | 'standing_serious' | 'standing_excited' | 'sitting_thinking' | 'pointing_left' | 'pointing_right' | 'hands_up' | 'arms_crossed' | 'crouching' | 'walking';

// New pose types matching extracted assets
export type HumanPose =
  | 'standing_neutral' | 'standing_happy' | 'standing_angry' | 'standing_scared'
  | 'standing_side_neutral' | 'sitting_sad' | 'sitting_neutral'
  | 'walking_neutral' | 'running_scared'
  | 'pointing_excited' | 'pointing_angry'
  | 'arms_crossed_angry' | 'arms_crossed_suspicious'
  | 'crouching_scared' | 'looking_back_scared'
  | 'hands_up_surprised' | 'hugging_self_sad'
  | 'jumping_happy' | 'leaning_determined'
  | 'standing_withdrawn' | 'standing_confident';

export type AnimalPose =
  | 'sitting_neutral' | 'sitting_happy'
  | 'standing_aggressive' | 'standing_scared'
  | 'side_neutral' | 'lying_sad' | 'lying_sleeping'
  | 'walking_neutral' | 'running_aggressive' | 'running_scared'
  | 'sitting_alert' | 'crouching_stalking'
  | 'looking_back' | 'barking_howling'
  | 'playful_happy' | 'defensive_stance';

export type PoseName = HumanPose | AnimalPose;

/** Composition brief from AI scene director */
export interface CompositionBrief {
  environment: {
    palette: [string, string, string, string, string];
    sky_tokens: string[];
    far_tokens: string[];
    mid_tokens: string[];
    fg_tokens: string[];
  };
  character: {
    visible: boolean;
    name?: string;
    placement: { x: number; y: number; scale: number };
    pose: CharacterPose;
    expression: CharacterExpression;
    silhouette: boolean;
  };
  camera: {
    movement: CameraMovement;
    focal_point: { x: number; y: number };
    intensity: 'subtle' | 'moderate' | 'dramatic';
  };
  lighting: {
    type: 'ambient' | 'directional' | 'spotlight' | 'rim_light' | 'backlit';
    direction: 'top_left' | 'top_right' | 'bottom_left' | 'bottom_right' | 'center' | 'behind';
    color: string;
    intensity: number;
  };
  mood: string;
}

export interface SceneProps {
  scene_id: number;
  narration_text: string;
  duration_estimate: number;
  actual_duration: number;
  durationInFrames: number;
  background: string;
  character_name: string;
  character_pose: CharacterPose | PoseName;
  character_expression: CharacterExpression;
  objects: string[];
  scene_type?: 'narrator_bridge' | 'evidence_closeup' | 'location_establishing' | 'timeline_card' | 'case_board' | 'suspect_or_witness' | 'reveal_or_twist';
  shot_type?: 'establishing' | 'wide' | 'medium' | 'close_up' | 'extreme_close_up' | 'pov';
  character_action?: 'narrating' | 'walking' | 'running' | 'looking' | 'thinking' | 'hiding' | 'pointing' | 'shocked' | 'afraid' | 'sad' | 'angry' | 'celebrating';
  camera: CameraMovement;
  transition: TransitionType;
  text_overlay: string | {text: string; font_size?: number; color?: string; position?: string} | null;
  mood: string;
  // New composition brief (optional for backward compat)
  composition?: CompositionBrief;
}

export interface StoryProps {
  scenes: SceneProps[];
  fps: number;
  totalFrames: number;
}
