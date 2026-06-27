import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { generateHooks, applyHookToScript } from '../services/hook-generator.js';
import { generateStoryboard } from '../services/storyboard-engine.js';

export const pipelineRouter = Router();

// POST /api/pipeline/run — run full pipeline end-to-end
pipelineRouter.post('/run', async (req, res) => {
  try {
    const { keyword, topic, angle, category, useStoryboard = true } = req.body;
    const projectId = uuidv4().split('-')[0];
    const baseUrl = `http://localhost:${process.env.PORT || 8002}`;

    const steps: string[] = [];
    let currentTopic = topic;
    let currentAngle = angle;

    // Step 1: Research (if no topic provided)
    if (!currentTopic && keyword) {
      steps.push('researching topic...');
      const researchRes = await fetch(`${baseUrl}/api/research?keyword=${encodeURIComponent(keyword)}`);
      const researchData = await researchRes.json() as any;
      currentTopic = researchData.selected_topic.topic;
      currentAngle = researchData.selected_topic.angle;
      steps.push(`topic selected: ${currentTopic}`);
    }

    if (!currentTopic) {
      return res.status(400).json({ error: 'Provide keyword or topic' });
    }

    // Step 2: Script with quality gate
    steps.push('generating script...');
    const scriptRes = await fetch(`${baseUrl}/api/script/with-quality-gate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: currentTopic, angle: currentAngle, category }),
    });

    if (!scriptRes.ok) {
      const err = await scriptRes.json() as any;
      return res.status(422).json({ error: 'Script failed quality gate', details: err, steps });
    }

    const scriptData = await scriptRes.json() as any;
    steps.push(`script approved (score: ${scriptData.quality_score.average})`);

    // Step 2.5: Hook generation + application
    let finalScript = scriptData.script;
    let hookData = null;
    try {
      steps.push('generating hook variants...');
      hookData = await generateHooks(currentTopic, finalScript, category || 'mystery');
      finalScript = applyHookToScript(finalScript, hookData.selected);
      steps.push(`hook applied (pattern: ${hookData.selected.pattern}, score: ${hookData.selected.estimated_retention_score}/10)`);
    } catch (hookErr: any) {
      steps.push(`hook generation skipped: ${hookErr.message}`);
    }

    // Step 3: Scene breakdown (storyboard engine or legacy)
    let scenesData: any;
    let storyboardMeta: any = null;

    if (useStoryboard) {
      try {
        steps.push('running storyboard engine...');
        const storyboard = await generateStoryboard(finalScript, currentTopic, category || 'mystery');
        storyboardMeta = {
          pacing_score: storyboard.pacing_score,
          arc_type: storyboard.emotion_arc.arc_type,
          act_structure: storyboard.act_structure,
        };

        // Convert storyboard scenes to SceneData format
        scenesData = {
          title: currentTopic,
          total_scenes: storyboard.scenes.length,
          estimated_duration_sec: storyboard.scenes.reduce((sum: number, s: any) => sum + s.duration_estimate, 0),
          scenes: storyboard.scenes.map((s: any) => ({
            scene_id: s.scene_id,
            narration_text: s.narration_text,
            duration_estimate: s.duration_estimate,
            background: s.background_asset || 'suburban_house',
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
            // Pass composition for camera/lighting data but NOT environment
            composition: s.character ? {
              character: {
                ...s.character,
                name: s.character_name || s.character.name,
              },
              camera: s.camera,
              lighting: s.lighting,
              mood: s.mood,
            } : undefined,
          })),
        };
        steps.push(`storyboard complete (${scenesData.total_scenes} scenes, pacing: ${storyboard.pacing_score}/10, arc: ${storyboard.emotion_arc.arc_type})`);
      } catch (sbErr: any) {
        steps.push(`storyboard engine failed, falling back to legacy: ${sbErr.message}`);
        scenesData = null; // fall through to legacy
      }
    }

    // Legacy fallback
    if (!scenesData) {
      steps.push('breaking into scenes (legacy)...');
      const scenesRes = await fetch(`${baseUrl}/api/scenes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script: finalScript, title: currentTopic }),
      });
      scenesData = await scenesRes.json() as any;
      steps.push(`${scenesData.total_scenes} scenes created`);
    }

    // Step 4: Voice generation
    steps.push('generating voice...');
    const voiceRes = await fetch(`${baseUrl}/api/voice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenes: scenesData.scenes, projectId }),
    });
    const voiceData = await voiceRes.json() as any;
    steps.push(`voice generated (${voiceData.total_duration_sec}s)`);

    // Step 5: Render
    steps.push('rendering animation...');
    const renderRes = await fetch(`${baseUrl}/api/render`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scenes: scenesData.scenes,
        projectId,
        audioTimings: voiceData.scenes,
      }),
    });
    const renderData = await renderRes.json() as any;
    steps.push('animation rendered');

    // Step 6: Assemble
    steps.push('assembling final video...');
    const assembleRes = await fetch(`${baseUrl}/api/assemble`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, useNvenc: true }),
    });
    const assembleData = await assembleRes.json() as any;
    steps.push(`video assembled (${assembleData.fileSizeMB}MB)`);

    // Step 7: Thumbnail
    steps.push('generating thumbnail...');
    const thumbRes = await fetch(`${baseUrl}/api/thumbnail`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: currentTopic, projectId }),
    });
    await thumbRes.json();
    steps.push('thumbnail created');

    // Step 8: Upload
    steps.push('uploading to YouTube...');
    const uploadRes = await fetch(`${baseUrl}/api/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, title: currentTopic }),
    });
    const uploadData = await uploadRes.json() as any;
    steps.push(`uploaded: ${uploadData.url}`);

    res.json({
      success: true,
      projectId,
      videoUrl: uploadData.url,
      steps,
      summary: {
        topic: currentTopic,
        duration: voiceData.total_duration_sec,
        scenes: scenesData.total_scenes,
        qualityScore: scriptData.quality_score.average,
        hook: hookData ? {
          pattern: hookData.selected.pattern,
          retention_score: hookData.selected.estimated_retention_score,
        } : null,
        storyboard: storyboardMeta,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/pipeline/status — check what's been published
pipelineRouter.get('/status', async (_req, res) => {
  const fs = await import('fs');
  const path = await import('path');
  const publishedPath = path.resolve('../output/published.json');

  if (!fs.existsSync(publishedPath)) {
    return res.json({ total: 0, videos: [] });
  }

  const published = JSON.parse(fs.readFileSync(publishedPath, 'utf-8'));
  res.json({ total: published.length, videos: published });
});
