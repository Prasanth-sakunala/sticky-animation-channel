import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import { uploadToYouTube } from '../services/youtube-upload.js';
import { generateJSON } from '../services/gemini.js';
import type { VideoMetadata } from '../types.js';

export const uploadRouter = Router();

const OUTPUT_DIR = path.resolve('../output');

// POST /api/upload — upload to YouTube
uploadRouter.post('/', async (req, res) => {
  try {
    const { projectId, title, customMetadata } = req.body;
    if (!projectId) {
      return res.status(400).json({ error: 'projectId required' });
    }

    const videoPath = path.join(OUTPUT_DIR, 'final', projectId, 'final_video.mp4');
    const thumbnailPath = path.join(OUTPUT_DIR, 'thumbnails', `${projectId}.png`);

    if (!fs.existsSync(videoPath)) {
      return res.status(404).json({ error: 'Final video not found. Run /api/assemble first.' });
    }

    // Generate metadata if not provided
    let metadata: VideoMetadata;
    if (customMetadata) {
      metadata = customMetadata;
    } else {
      const prompt = `Generate YouTube video metadata for a story/mystery video titled: "${title || projectId}"

Respond in JSON:
{
  "title": "catchy title under 60 chars, includes primary keyword",
  "description": "500+ word SEO description with timestamps section, related topics, and call to action. Include relevant keywords naturally.",
  "tags": ["15-20 relevant tags"],
  "categoryId": "27"
}`;

      metadata = await generateJSON<VideoMetadata>(prompt);
    }

    const videoId = await uploadToYouTube({
      videoPath,
      title: metadata.title,
      description: metadata.description,
      tags: metadata.tags,
      categoryId: metadata.categoryId,
      thumbnailPath: fs.existsSync(thumbnailPath) ? thumbnailPath : undefined,
    });

    // Log to published list
    const publishedPath = path.resolve('../output/published.json');
    const published = fs.existsSync(publishedPath)
      ? JSON.parse(fs.readFileSync(publishedPath, 'utf-8'))
      : [];

    published.push({
      videoId,
      projectId,
      title: metadata.title,
      uploadedAt: new Date().toISOString(),
      url: `https://youtube.com/watch?v=${videoId}`,
    });

    fs.writeFileSync(publishedPath, JSON.stringify(published, null, 2));

    res.json({
      videoId,
      url: `https://youtube.com/watch?v=${videoId}`,
      metadata,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
