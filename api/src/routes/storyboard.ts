import { Router } from 'express';
import { classifyEmotions } from '../services/emotion-classifier.js';
import { generateHooks, applyHookToScript } from '../services/hook-generator.js';
import { generateStoryboard } from '../services/storyboard-engine.js';

export const storyboardRouter = Router();

// POST /api/storyboard — full storyboard generation (emotion + acts + characters)
storyboardRouter.post('/', async (req, res) => {
  try {
    const { script, title, category } = req.body;
    if (!script) {
      return res.status(400).json({ error: 'script required in body' });
    }

    const result = await generateStoryboard(script, title || 'Untitled', category || 'mystery');

    res.json({
      title: title || 'Untitled',
      total_scenes: result.scenes.length,
      estimated_duration_sec: result.scenes.reduce((sum, s) => sum + s.duration_estimate, 0),
      pacing_score: result.pacing_score,
      act_structure: result.act_structure,
      emotion_arc: {
        arc_type: result.emotion_arc.arc_type,
        climax_index: result.emotion_arc.climax_index,
        mood_curve: result.emotion_arc.mood_curve,
      },
      scenes: result.scenes,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/storyboard/emotions — classify emotions only
storyboardRouter.post('/emotions', async (req, res) => {
  try {
    const { script } = req.body;
    if (!script) {
      return res.status(400).json({ error: 'script required in body' });
    }

    const arc = await classifyEmotions(script);
    res.json(arc);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/storyboard/hooks — generate hook variants
storyboardRouter.post('/hooks', async (req, res) => {
  try {
    const { topic, script, category, numVariants } = req.body;
    if (!topic || !script) {
      return res.status(400).json({ error: 'topic and script required in body' });
    }

    const hooks = await generateHooks(topic, script, category || 'mystery', numVariants || 3);
    res.json(hooks);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/storyboard/apply-hook — replace script opening with selected hook
storyboardRouter.post('/apply-hook', async (req, res) => {
  try {
    const { script, hook } = req.body;
    if (!script || !hook) {
      return res.status(400).json({ error: 'script and hook required in body' });
    }

    const updatedScript = applyHookToScript(script, hook);
    const wordCount = updatedScript.split(/\s+/).length;

    res.json({
      script: updatedScript,
      word_count: wordCount,
      estimated_duration_sec: Math.round(wordCount / 2.5),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
