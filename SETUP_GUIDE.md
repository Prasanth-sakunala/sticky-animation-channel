# Sticky Animation Channel — Setup Guide

## System Requirements (Your Laptop)
- 16GB RAM ✅
- RTX 3050 6GB ✅ (Kokoro TTS can use GPU for faster inference)
- Node.js 18+ 
- Docker Desktop
- FFmpeg
- Git

---

## Ports Used

| Service | Port |
|---------|------|
| API Server | 8002 |
| n8n | 5680 |
| Remotion Studio | 3001 |
| Kokoro TTS | 8003 |

---

## Step-by-Step Setup

### 1. Install Prerequisites

```powershell
# Install Node.js 18+ (if not already)
winget install OpenJS.NodeJS.LTS

# Install FFmpeg
winget install Gyan.FFmpeg

# Install Docker Desktop
winget install Docker.DockerDesktop

# Verify installations
node --version
npm --version
ffmpeg -version
docker --version
```

### 2. Clone/Copy Project

```powershell
cd C:\Users\YourName\Desktop
# Copy the sticky-animation-channel folder to your laptop
```

### 3. Setup API Server

```powershell
cd sticky-animation-channel/api
npm install
cp .env.example .env
# Edit .env with your API keys (see below)
```

### 4. Setup Remotion

```powershell
cd sticky-animation-channel/remotion
npm install
# Test Remotion studio
npx remotion studio --port 3001
```

### 5. Setup Kokoro TTS

```powershell
cd sticky-animation-channel/kokoro-tts
pip install -r requirements.txt
# Download model (first time only, ~1GB)
python download_model.py
# Test
python server.py --port 8003
```

### 6. Setup n8n

```powershell
cd sticky-animation-channel
docker-compose up -d n8n
# Access n8n at http://localhost:5680
```

### 7. YouTube API Credentials

1. Go to https://console.cloud.google.com/
2. Create new project: "Sticky Animation Channel"
3. Enable "YouTube Data API v3"
4. Create OAuth 2.0 credentials (Desktop app)
5. Download `client_secret.json` → place in `credentials/`
6. Run token generation:
   ```powershell
   cd sticky-animation-channel/api
   npm run youtube:auth
   ```
7. Follow browser prompt to authorize
8. Token saved to `credentials/youtube_token.json`

### 8. Gemini API Key

1. Go to https://aistudio.google.com/apikey
2. Create API key (free tier)
3. Add to `.env`: `GEMINI_API_KEY=your_key_here`

### 9. Run Everything

```powershell
# Option A: Docker (all services)
cd sticky-animation-channel
docker-compose up -d

# Option B: Manual (for development)
# Terminal 1: API
cd api && npm run dev

# Terminal 2: Kokoro TTS
cd kokoro-tts && python server.py --port 8003

# Terminal 3: n8n
docker-compose up n8n
```

### 10. Test Pipeline

```powershell
# Test topic research
curl http://localhost:8002/api/research?keyword=mysteries

# Test script generation
curl -X POST http://localhost:8002/api/script -H "Content-Type: application/json" -d "{\"topic\": \"Dyatlov Pass\", \"angle\": \"What happened?\"}"

# Test full pipeline
curl -X POST http://localhost:8002/api/pipeline/run -H "Content-Type: application/json" -d "{\"keyword\": \"unsolved mysteries\"}"
```

---

## Environment Variables (.env)

```
GEMINI_API_KEY=your_gemini_api_key
YOUTUBE_CLIENT_SECRET_PATH=../credentials/client_secret.json
YOUTUBE_TOKEN_PATH=../credentials/youtube_token.json
PORT=8002
REMOTION_PORT=3001
KOKORO_TTS_URL=http://localhost:8003
TTS_FALLBACK=edge-tts
NODE_ENV=development
```

---

## Folder Permissions

Make sure these folders are writable:
```
output/audio/
output/scenes/
output/thumbnails/
output/final/
```

---

## GPU Notes (RTX 3050)

- Kokoro TTS will auto-detect CUDA and use GPU
- Remotion rendering is CPU-based (Node.js) — your 16GB RAM is plenty
- FFmpeg can use NVENC for faster encoding:
  ```
  ffmpeg -i input.mp4 -c:v h264_nvenc -c:a aac output.mp4
  ```
  (Falls back to libx264 if NVENC unavailable)

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `EACCES` on port | Change port in .env |
| Remotion out of memory | Set `--concurrency=2` in render command |
| Kokoro model not found | Run `python download_model.py` again |
| YouTube quota exceeded | Wait 24h, quota resets daily Pacific time |
| FFmpeg not found | Add to PATH: `$env:PATH += ";C:\ffmpeg\bin"` |
| Docker not starting | Ensure Docker Desktop is running + WSL2 enabled |
