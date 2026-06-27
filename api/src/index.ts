import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { researchRouter } from './routes/research.js';
import { scriptRouter } from './routes/script.js';
import { scenesRouter } from './routes/scenes.js';
import { voiceRouter } from './routes/voice.js';
import { renderRouter } from './routes/render.js';
import { assembleRouter } from './routes/assemble.js';
import { thumbnailRouter } from './routes/thumbnail.js';
import { uploadRouter } from './routes/upload.js';
import { pipelineRouter } from './routes/pipeline.js';
import { storyboardRouter } from './routes/storyboard.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8002;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Routes
app.use('/api/research', researchRouter);
app.use('/api/script', scriptRouter);
app.use('/api/scenes', scenesRouter);
app.use('/api/voice', voiceRouter);
app.use('/api/render', renderRouter);
app.use('/api/assemble', assembleRouter);
app.use('/api/thumbnail', thumbnailRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/pipeline', pipelineRouter);
app.use('/api/storyboard', storyboardRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'sticky-animation-api', port: PORT });
});

app.listen(PORT, () => {
  console.log(`Sticky Animation API running on port ${PORT}`);
});
