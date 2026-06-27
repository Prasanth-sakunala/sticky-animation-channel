import { Router } from 'express';
import { getYouTubeSuggestions } from '../services/youtube-suggest.js';
import { generateJSON } from '../services/gemini.js';
import type { TopicResult } from '../types.js';

export const researchRouter = Router();

// GET /api/research?keyword=mysteries
researchRouter.get('/', async (req, res) => {
  try {
    const keyword = req.query.keyword as string;
    if (!keyword) {
      return res.status(400).json({ error: 'keyword query param required' });
    }

    // Get YouTube suggestions
    const suggestions = await getYouTubeSuggestions(keyword);

    // Use Gemini to pick the best topic and create an angle
    const prompt = `You are a YouTube topic researcher. Given these search suggestions related to "${keyword}", pick the ONE topic with the highest viral/story potential and create a compelling angle.

Suggestions:
${suggestions.map(s => `- ${s.query}`).join('\n')}

Pick the topic that:
1. Has a clear story/mystery/narrative
2. People would click on
3. Can be told in 3-5 minutes
4. Has emotional or curiosity appeal

Respond in JSON:
{
  "topic": "chosen topic title",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "angle": "the specific angle/question this video will answer",
  "category": "mystery|history|psychology|science|internet",
  "estimated_demand": "high|medium|low"
}`;

    const topic = await generateJSON<TopicResult>(prompt);

    res.json({ suggestions, selected_topic: topic });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/research/rank — rank multiple topics
researchRouter.post('/rank', async (req, res) => {
  try {
    const { keywords } = req.body as { keywords: string[] };
    if (!keywords || !Array.isArray(keywords)) {
      return res.status(400).json({ error: 'keywords array required in body' });
    }

    const allSuggestions: string[] = [];
    for (const kw of keywords) {
      const suggestions = await getYouTubeSuggestions(kw);
      allSuggestions.push(...suggestions.map(s => s.query));
    }

    const prompt = `You are a YouTube topic researcher. From these search suggestions, pick the TOP 3 topics ranked by viral potential for a story/mystery channel.

All suggestions:
${allSuggestions.map(s => `- ${s}`).join('\n')}

For each, respond in JSON array format:
[
  {
    "topic": "topic title",
    "keywords": ["kw1", "kw2"],
    "angle": "specific angle",
    "category": "category",
    "estimated_demand": "high|medium|low"
  }
]`;

    const topics = await generateJSON<TopicResult[]>(prompt);
    res.json({ topics });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
