import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

interface UploadOptions {
  videoPath: string;
  title: string;
  description: string;
  tags: string[];
  categoryId?: string;
  thumbnailPath?: string;
  privacyStatus?: 'public' | 'private' | 'unlisted';
}

function getAuthClient() {
  const secretPath = process.env.YOUTUBE_CLIENT_SECRET_PATH || '../credentials/client_secret.json';
  const tokenPath = process.env.YOUTUBE_TOKEN_PATH || '../credentials/youtube_token.json';

  const credentials = JSON.parse(fs.readFileSync(path.resolve(secretPath), 'utf-8'));
  const { client_id, client_secret, redirect_uris } = credentials.installed || credentials.web;

  const oauth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  const token = JSON.parse(fs.readFileSync(path.resolve(tokenPath), 'utf-8'));
  oauth2Client.setCredentials(token);

  return oauth2Client;
}

export async function uploadToYouTube(options: UploadOptions): Promise<string> {
  const {
    videoPath,
    title,
    description,
    tags,
    categoryId = '27', // Education
    thumbnailPath,
    privacyStatus = 'public',
  } = options;

  const auth = getAuthClient();
  const youtube = google.youtube({ version: 'v3', auth });

  // Upload video
  const response = await youtube.videos.insert({
    part: ['snippet', 'status'],
    requestBody: {
      snippet: {
        title,
        description,
        tags,
        categoryId,
        defaultLanguage: 'en',
      },
      status: {
        privacyStatus,
        selfDeclaredMadeForKids: false,
      },
    },
    media: {
      body: fs.createReadStream(videoPath),
    },
  });

  const videoId = response.data.id!;
  console.log(`Video uploaded: https://youtube.com/watch?v=${videoId}`);

  // Upload thumbnail if provided
  if (thumbnailPath && fs.existsSync(thumbnailPath)) {
    await youtube.thumbnails.set({
      videoId,
      media: {
        body: fs.createReadStream(thumbnailPath),
      },
    });
    console.log('Thumbnail uploaded');
  }

  return videoId;
}
