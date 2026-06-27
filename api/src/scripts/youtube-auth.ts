import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import http from 'http';
import { URL } from 'url';

/**
 * Run this script to generate YouTube OAuth token:
 *   npm run youtube:auth
 * 
 * Prerequisites:
 * 1. Place client_secret.json in ../credentials/
 * 2. Run this script
 * 3. Browser opens → authorize → token saved
 */

const SCOPES = ['https://www.googleapis.com/auth/youtube.upload'];
const SECRET_PATH = path.resolve(process.env.YOUTUBE_CLIENT_SECRET_PATH || '../credentials/client_secret.json');
const TOKEN_PATH = path.resolve(process.env.YOUTUBE_TOKEN_PATH || '../credentials/youtube_token.json');

async function main() {
  if (!fs.existsSync(SECRET_PATH)) {
    console.error(`client_secret.json not found at: ${SECRET_PATH}`);
    console.error('Download it from Google Cloud Console → APIs → Credentials → OAuth 2.0');
    process.exit(1);
  }

  const credentials = JSON.parse(fs.readFileSync(SECRET_PATH, 'utf-8'));
  const { client_id, client_secret } = credentials.installed || credentials.web;

  // Use localhost redirect for desktop app flow
  const REDIRECT_URI = 'http://localhost:3456/callback';

  const oauth2Client = new google.auth.OAuth2(client_id, client_secret, REDIRECT_URI);

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });

  console.log('\n=== YouTube OAuth Setup ===\n');
  console.log('Opening browser for authorization...\n');

  // Start local server to catch callback
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url!, `http://localhost:3456`);
    if (url.pathname === '/callback') {
      const code = url.searchParams.get('code');
      if (code) {
        try {
          const { tokens } = await oauth2Client.getToken(code);
          oauth2Client.setCredentials(tokens);

          // Save token
          const tokenDir = path.dirname(TOKEN_PATH);
          if (!fs.existsSync(tokenDir)) fs.mkdirSync(tokenDir, { recursive: true });
          fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));

          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end('<h1>✓ Authorization successful!</h1><p>You can close this tab.</p>');
          console.log(`\n✓ Token saved to: ${TOKEN_PATH}`);
          console.log('YouTube upload is now configured!\n');
        } catch (err: any) {
          res.writeHead(500, { 'Content-Type': 'text/html' });
          res.end(`<h1>Error</h1><p>${err.message}</p>`);
          console.error('Token exchange failed:', err.message);
        }
      } else {
        res.writeHead(400, { 'Content-Type': 'text/html' });
        res.end('<h1>Error: No code received</h1>');
      }
      setTimeout(() => { server.close(); process.exit(0); }, 1000);
    }
  });

  server.listen(3456, () => {
    console.log(`Auth callback server listening on port 3456`);
    console.log(`\nIf browser doesn't open automatically, visit:\n${authUrl}\n`);

    // Open browser
    const { exec } = require('child_process');
    const startCmd = process.platform === 'win32' ? 'start' : process.platform === 'darwin' ? 'open' : 'xdg-open';
    exec(`${startCmd} "${authUrl}"`);
  });
}

main().catch(console.error);
