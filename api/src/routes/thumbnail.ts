import { Router } from 'express';
import { createCanvas, loadImage } from 'canvas';
import path from 'path';
import fs from 'fs';
import { generateJSON } from '../services/gemini.js';

export const thumbnailRouter = Router();

const OUTPUT_DIR = path.resolve('../output/thumbnails');

interface ThumbnailConcept {
  dominant_color: string;
  text: string;
  emotion: string;
  character_pose: string;
}

// POST /api/thumbnail — generate thumbnail
thumbnailRouter.post('/', async (req, res) => {
  try {
    const { title, projectId } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'title required' });
    }

    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    // Get thumbnail concept from Gemini
    const prompt = `Suggest a YouTube thumbnail concept for this video: "${title}"

The thumbnail uses a simple animated character (stick-figure style) on a bold background.

Respond in JSON:
{
  "dominant_color": "hex color for background (bold, eye-catching)",
  "text": "max 4 words for thumbnail text (shocking/curious)",
  "emotion": "character expression to show",
  "character_pose": "hands_up|pointing_right|standing_serious|arms_crossed"
}`;

    const concept = await generateJSON<ThumbnailConcept>(prompt);

    // Render thumbnail (1280x720)
    const canvas = createCanvas(1280, 720);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = concept.dominant_color;
    ctx.fillRect(0, 0, 1280, 720);

    // Add slight gradient overlay
    const gradient = ctx.createLinearGradient(0, 0, 0, 720);
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.3)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1280, 720);

    // Text (large, bold, with shadow)
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 80px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Word wrap if needed
    const words = concept.text.split(' ');
    if (words.length <= 2) {
      ctx.font = 'bold 100px Arial';
      ctx.fillText(concept.text.toUpperCase(), 640, 360);
    } else {
      const line1 = words.slice(0, 2).join(' ');
      const line2 = words.slice(2).join(' ');
      ctx.fillText(line1.toUpperCase(), 640, 300);
      ctx.fillText(line2.toUpperCase(), 640, 420);
    }
    ctx.restore();

    // Add border for contrast
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 8;
    ctx.strokeRect(20, 20, 1240, 680);

    // Save
    const outputPath = path.join(OUTPUT_DIR, `${projectId || 'thumbnail'}.png`);
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);

    res.json({
      outputPath,
      concept,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
