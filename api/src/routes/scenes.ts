import { Router } from 'express';
import { generateJSON } from '../services/gemini.js';
import { generateStoryboard } from '../services/storyboard-engine.js';
import { validateScenePack } from '../utils/scene-quality-gate.js';
import type { SceneBreakdown } from '../types.js';

export const scenesRouter = Router();

// POST /api/scenes — break script into scenes with composition briefs
scenesRouter.post('/', async (req, res) => {
  try {
    const { script, title, mode, category } = req.body;
    if (!script) {
      return res.status(400).json({ error: 'script required in body' });
    }

    // New pipeline: use Storyboard Engine for rich scene and character mapping
    if (mode !== 'legacy') {
      try {
        const storyboard = await generateStoryboard(script, title || 'Untitled', category || 'mystery');

        const scenes = storyboard.scenes.map((s: any) => ({
          scene_id: s.scene_id,
          narration_text: s.narration_text || '',
          duration_estimate: s.duration_estimate || 4,
          // Use PNG background resolved from description
          background: s.background_asset || 'bg17_suburb_day',
          character_name: s.character_name || s.character?.name || 'marcus',
          character_pose: s.character?.pose || 'standing_neutral',
          character_expression: s.character?.expression || 'neutral',
          objects: s.scene_objects || [],
          scene_type: s.scene_type || 'narrator_bridge',
          shot_type: s.shot_type || 'medium',
          character_action: s.character_action || 'narrating',
          camera: s.camera?.movement || 'static',
          transition: s.transition || 'fade',
          text_overlay: s.text_overlay || null,
          mood: s.mood || 'neutral',
          // Pass character/camera/lighting but NOT environment (we use PNG backgrounds)
          composition: s.character ? {
            character: {
              ...s.character,
              name: s.character_name || s.character.name || 'marcus',
            },
            camera: s.camera,
            lighting: s.lighting,
            mood: s.mood,
          } : undefined,
        }));

        const result: SceneBreakdown = {
          title: title || 'Untitled',
          total_scenes: scenes.length,
          estimated_duration_sec: scenes.reduce((sum, s) => sum + (s.duration_estimate || 4), 0),
          scenes,
        };

        // Quality gate
        const gateResult = validateScenePack(scenes);
        if (!gateResult.passed) {
          return res.status(422).json({
            error: 'Scene pack failed quality gate',
            score: gateResult.score,
            issues: gateResult.issues,
            stats: gateResult.stats,
          });
        }

        return res.json({ ...result, quality_gate: { score: gateResult.score, issues: gateResult.issues } });
      } catch (directorError: any) {
        console.warn('Storyboard Engine failed, falling back to legacy:', directorError.message);
        // Fall through to legacy prompt
      }
    }

    // Legacy pipeline (fallback)
    const prompt = `Break this narration script into visual scenes for a simple animated story video.

TITLE: ${title || 'Untitled'}

SCRIPT:
"""
${script}
"""

Each scene should be 3-8 seconds of narration (8-20 words).

Available assets:

BACKGROUNDS: snowy_mountain, dark_forest, city_night, ocean, desert, space, laboratory, old_room, cave, generic_dark, generic_light

CHARACTER POSES: standing_neutral, standing_serious, standing_excited, sitting_thinking, pointing_left, pointing_right, hands_up, arms_crossed

CHARACTER EXPRESSIONS: neutral, surprised, thinking, scared, excited, confused, angry, happy

OBJECTS: snow_particles, rain, fire, clock, map, footprints, question_mark, exclamation, skull, magnifying_glass, book, mountain_silhouette, tent, moon, flashlight_beam

CAMERA MOVEMENTS: static, slow_zoom_in, pan_left, pan_right, shake

TRANSITIONS: cut, fade, slide_left

MOODS: tense, mysterious, calm, dramatic, upbeat

For each scene output:
{
  "scene_id": number,
  "narration_text": "exact narration text for this scene",
  "duration_estimate": number (seconds, based on ~2.5 words/sec),
  "background": "one from list above",
  "character_pose": "one from list above",
  "character_expression": "one from list above",
  "objects": ["from list above"],
  "camera": "one from list above",
  "transition": "one from list above",
  "text_overlay": "on-screen text or null",
  "mood": "one from list above"
}

Respond with full JSON:
{
  "title": "${title || 'Untitled'}",
  "total_scenes": number,
  "estimated_duration_sec": number,
  "scenes": [...]
}

IMPORTANT: Use ONLY assets from the lists above. Every word of the script must appear in exactly one scene's narration_text.`;

    const breakdown = await generateJSON<SceneBreakdown>(prompt, 0.3);

    if (breakdown.scenes) {
      breakdown.scenes = breakdown.scenes.map((scene: any) => ({
        ...scene,
        narration_text: scene.narration_text || scene.naration_text || '',
      }));
    }

    res.json(breakdown);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
