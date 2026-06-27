export interface TopicResult {
  topic: string;
  keywords: string[];
  angle: string;
  category: string;
  estimated_demand: 'high' | 'medium' | 'low';
}

export interface ScriptResult {
  script: string;
  word_count: number;
  estimated_duration_sec: number;
}

export interface QualityScore {
  hook_strength: number;
  pacing: number;
  payoff: number;
  speakability: number;
  retention_hooks: number;
  average: number;
  approved: boolean;
  feedback?: string;
}

export interface SceneData {
  scene_id: number;
  narration_text: string;
  duration_estimate: number;
  background: string;
  character_name?: string;
  character_pose: string;
  character_expression: string;
  objects: string[];
  scene_type?: 'narrator_bridge' | 'evidence_closeup' | 'location_establishing' | 'timeline_card' | 'case_board' | 'suspect_or_witness' | 'reveal_or_twist';
  shot_type?: 'establishing' | 'wide' | 'medium' | 'close_up' | 'extreme_close_up' | 'pov';
  character_action?: 'narrating' | 'walking' | 'running' | 'looking' | 'thinking' | 'hiding' | 'pointing' | 'shocked' | 'afraid' | 'sad' | 'angry' | 'celebrating';
  camera: 'static' | 'slow_zoom_in' | 'slow_zoom_out' | 'pan_left' | 'pan_right' | 'drift_up' | 'shake' | 'dolly_in' | 'orbit' | 'push_in' | 'pull_back' | 'tilt_up' | 'tilt_down' | 'crane_up';
  transition: 'cut' | 'fade' | 'slide_left' | 'dissolve' | 'wipe_right' | 'zoom_in' | 'blur' | 'glitch' | 'whip_pan';
  text_overlay: string | null;
  mood: 'tense' | 'mysterious' | 'calm' | 'dramatic' | 'upbeat' | 'eerie' | 'melancholic' | 'triumphant';
  // New: rich composition brief from Scene Director
  composition?: {
    environment?: {
      palette: [string, string, string, string, string];
      sky_tokens: string[];
      far_tokens: string[];
      mid_tokens: string[];
      fg_tokens: string[];
    };
    character: {
      visible: boolean;
      placement: { x: number; y: number; scale: number };
      pose: string;
      expression: string;
      silhouette: boolean;
    };
    camera: {
      movement: string;
      focal_point: { x: number; y: number };
      intensity: 'subtle' | 'moderate' | 'dramatic';
    };
    lighting: {
      type: string;
      direction: string;
      color: string;
      intensity: number;
    };
    mood: string;
  };
}

export interface SceneBreakdown {
  title: string;
  total_scenes: number;
  estimated_duration_sec: number;
  scenes: SceneData[];
}

export interface VideoMetadata {
  title: string;
  description: string;
  tags: string[];
  categoryId: string;
  thumbnailConcept: {
    dominant_color: string;
    main_visual: string;
    text: string;
    emotion: string;
  };
}
