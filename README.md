# Sticky Animation Channel 🎬

Automated YouTube video creation system for unsolved mystery content. This project uses AI, animation, text-to-speech, and video rendering to generate engaging short-form videos entirely programmatically.

## 🎯 Project Overview

Sticky Animation Channel is a multi-component system that automates the end-to-end process of creating YouTube videos:

1. **Research & Scripting** - AI-powered content generation using Google Gemini
2. **Scene Rendering** - Animated scenes created with Remotion and custom React components
3. **Audio Generation** - High-quality text-to-speech using Kokoro TTS
4. **Video Assembly** - FFmpeg-based video composition and rendering
5. **YouTube Publishing** - Automatic upload and metadata management
6. **Workflow Automation** - n8n-based orchestration

## 🏗️ Architecture

### Core Components

| Component | Purpose | Technology |
|-----------|---------|-----------|
| **API Server** | REST API & orchestration | Node.js, Express, TypeScript |
| **Remotion** | 3D/2D scene rendering | Remotion, React, Three.js |
| **Kokoro TTS** | Text-to-speech generation | Python, Kokoro model, CUDA |
| **n8n** | Workflow automation | n8n, Docker |
| **FFmpeg** | Video encoding/composition | FFmpeg CLI |

### Service Ports

| Service | Port | URL |
|---------|------|-----|
| API Server | 8002 | http://localhost:8002 |
| Remotion Studio | 3001 | http://localhost:3001 |
| Kokoro TTS | 8003 | http://localhost:8003 |
| n8n | 5680 | http://localhost:5680 |

## 📁 Directory Structure

```
sticky-animation-channel/
├── api/                          # Node.js API Server
│   ├── src/
│   │   ├── index.ts             # Express app entry point
│   │   ├── types.ts             # TypeScript interfaces
│   │   ├── routes/              # API endpoints
│   │   │   ├── assemble.ts      # Video assembly endpoint
│   │   │   ├── pipeline.ts      # Full pipeline execution
│   │   │   ├── render.ts        # Scene rendering
│   │   │   ├── research.ts      # Research/scripting
│   │   │   ├── scenes.ts        # Scene configuration
│   │   │   ├── script.ts        # Script generation
│   │   │   ├── thumbnail.ts     # Thumbnail generation
│   │   │   ├── upload.ts        # YouTube upload
│   │   │   └── voice.ts         # TTS generation
│   │   ├── services/            # Business logic
│   │   │   ├── ffmpeg.ts        # FFmpeg wrapper
│   │   │   ├── gemini.ts        # Google Gemini API
│   │   │   ├── scene-director.ts # Scene orchestration
│   │   │   ├── tts.ts           # TTS service
│   │   │   ├── youtube-suggest.ts # YouTube suggestions
│   │   │   └── youtube-upload.ts # YouTube upload
│   │   ├── utils/               # Utilities
│   │   │   ├── audio-analysis.ts # Audio processing
│   │   │   ├── paths.ts         # Path management
│   │   │   └── quality-gate.ts  # Quality checks
│   │   └── scripts/             # CLI tools
│   │       └── youtube-auth.ts  # OAuth setup
│   ├── Dockerfile               # Docker image for API
│   ├── package.json
│   └── tsconfig.json
│
├── remotion/                    # Remotion Animation Engine
│   ├── src/
│   │   ├── Root.tsx            # Root component
│   │   ├── Story.tsx           # Main story component
│   │   ├── Scene.tsx           # Scene wrapper
│   │   ├── components/         # React components
│   │   │   ├── Background.tsx
│   │   │   ├── Camera.tsx
│   │   │   ├── Character.tsx
│   │   │   ├── EnvironmentLayer.tsx
│   │   │   ├── ObjectLayer.tsx
│   │   │   ├── ParticleLayer.tsx
│   │   │   ├── PostProcess.tsx
│   │   │   ├── TextOverlay.tsx
│   │   │   └── VolumetricLight.tsx
│   │   └── lib/                # Utilities
│   │       ├── animations.ts
│   │       ├── asset-tokens.tsx
│   │       ├── layout.ts
│   │       ├── scene-analysis.ts
│   │       └── types.ts
│   ├── remotion.config.ts
│   ├── package.json
│   └── tsconfig.json
│
├── kokoro-tts/                 # Text-to-Speech Service
│   ├── server.py              # Flask TTS server
│   ├── download_model.py      # Model downloader
│   ├── Dockerfile             # Docker image
│   └── requirements.txt        # Python dependencies
│
├── assets/                     # Media assets
│   ├── backgrounds/           # Scene backgrounds
│   ├── characters/            # Character models & expressions
│   │   └── narrator/
│   │       ├── expressions/
│   │       ├── mouth/
│   │       └── poses/
│   ├── music/                 # Audio tracks
│   └── objects/               # 3D/2D objects
│
├── output/                     # Generated content
│   ├── audio/                 # Generated audio files
│   ├── final/                 # Finished videos
│   ├── scenes/                # Rendered scenes
│   ├── thumbnails/            # Video thumbnails
│   └── published.json         # Upload history
│
├── credentials/               # API credentials
│   ├── client_secret.json     # YouTube OAuth (git-ignored)
│   └── youtube_token.json     # YouTube auth token (git-ignored)
│
├── n8n/                       # Workflow automation
│   └── workflow.json          # n8n workflow definition
│
├── docker-compose.yml         # Multi-service orchestration
├── SETUP_GUIDE.md            # Detailed setup instructions
└── README.md                  # This file
```

## ✨ Features

### Content Generation
- **AI-Powered Research** - Automated fact gathering and script writing using Google Gemini
- **Dynamic Scene Rendering** - Customizable animated scenes with React/Remotion
- **Multi-Voice Support** - Kokoro TTS + Edge TTS fallback
- **Audio Analysis** - Beat detection and synchronization
- **Thumbnail Generation** - Automatic video thumbnails

### Video Processing
- **Scene Assembly** - Combine multiple layers and effects
- **Quality Gates** - Automatic validation and filtering
- **Video Encoding** - FFmpeg-based rendering with optimization
- **Resolution Support** - 1080p, 720p, and preview modes

### YouTube Integration
- **OAuth Authentication** - Secure YouTube API access
- **Automatic Upload** - Scheduled publishing with metadata
- **Channel Management** - Playlist organization
- **Upload History** - Tracking and deduplication

### Workflow Automation
- **n8n Integration** - Visual workflow builder for complex pipelines
- **Error Handling** - Graceful fallbacks and retry logic
- **Monitoring** - Progress tracking and logging

## 🔧 Technology Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **AI**: Google Generative AI (Gemini)
- **Video**: FFmpeg, Fluent-FFmpeg
- **Audio**: Edge TTS, Kokoro TTS
- **APIs**: Google YouTube API v3

### Frontend / Rendering
- **Framework**: Remotion 4.x
- **Rendering**: React 18.x
- **3D Graphics**: Three.js (via Remotion)
- **Image Processing**: Sharp

### Infrastructure
- **Containerization**: Docker, Docker Compose
- **Orchestration**: n8n
- **GPU Support**: CUDA/NVIDIA (for Kokoro TTS)

### Python Services
- **Framework**: Flask
- **TTS Model**: Kokoro
- **GPU**: CUDA support for inference

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Docker Desktop
- FFmpeg
- Git
- Python 3.9+ (for Kokoro TTS)
- 16GB RAM minimum
- GPU (RTX 2060+) recommended

### Installation

**Detailed setup instructions are in [SETUP_GUIDE.md](SETUP_GUIDE.md)**

Quick start:
```bash
# 1. Install dependencies
cd api && npm install
cd ../remotion && npm install

# 2. Setup environment
cp api/.env.example api/.env
# Edit api/.env with your API keys

# 3. Start services
docker-compose up

# 4. Authorize YouTube (first time)
cd api && npm run youtube:auth
```

## 📡 API Endpoints

### Pipeline Operations
- `POST /api/pipeline/run` - Execute full video creation pipeline
- `POST /api/pipeline/status/:id` - Check pipeline status

### Research & Scripting
- `POST /api/research` - Generate research content
- `POST /api/script` - Generate video script

### Scene Rendering
- `POST /api/render` - Render scene to video
- `POST /api/scenes` - Get available scenes
- `POST /api/scenes/create` - Create custom scene

### Audio Generation
- `POST /api/voice/generate` - Generate audio from text
- `POST /api/voice/analyze` - Analyze audio properties

### Video Assembly
- `POST /api/assemble` - Assemble final video
- `POST /api/thumbnail` - Generate thumbnail

### YouTube
- `POST /api/upload` - Upload to YouTube
- `POST /api/youtube/auth` - Initialize YouTube auth

## ⚙️ Configuration

### Environment Variables

Create `.env` file in `api/` directory:

```env
NODE_ENV=production
PORT=8002

# Google APIs
GEMINI_API_KEY=your_gemini_api_key_here

# TTS Services
KOKORO_TTS_URL=http://localhost:8003
TTS_FALLBACK=edge-tts

# Rendering
REMOTION_URL=http://localhost:3001

# YouTube (generated via npm run youtube:auth)
YOUTUBE_CLIENT_ID=your_client_id
YOUTUBE_CLIENT_SECRET=your_client_secret
```

## 🎬 Usage Examples

### Run Full Pipeline
```bash
cd api
npm run pipeline
```

### Render a Single Scene
```bash
curl -X POST http://localhost:8002/api/render \
  -H "Content-Type: application/json" \
  -d '{
    "scene": "mystery-intro",
    "duration": 10
  }'
```

### Generate Voice
```bash
curl -X POST http://localhost:8002/api/voice/generate \
  -H "Content-Type: application/json" \
  -d '{
    "text": "The mystery deepens...",
    "voice": "narrator"
  }'
```

### Upload to YouTube
```bash
curl -X POST http://localhost:8002/api/upload \
  -H "Content-Type: application/json" \
  -d '{
    "videoPath": "output/final/video.mp4",
    "title": "The Dyatlov Pass Incident",
    "description": "...",
    "tags": ["mystery", "unsolved"]
  }'
```

## 📊 Output Structure

Generated files are organized in `output/`:

```
output/
├── audio/               # TTS audio files (.mp3/.wav)
├── final/              # Completed videos (.mp4)
├── scenes/             # Rendered scene frames
│   └── {story-name}/
│       └── input-props.json
├── thumbnails/        # Video thumbnails (.png)
└── published.json     # Upload log & history
```

## 🔍 Development

### Development Mode
```bash
cd api
npm run dev          # Watch mode TypeScript

# In another terminal
cd remotion
npm run studio       # Interactive Remotion studio
```

### Build
```bash
cd api && npm run build
cd remotion && npm run build
```

### Testing
```bash
npm test             # Run tests (if configured)
```

## 📦 Docker Deployment

The project includes multi-service Docker Compose setup:

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop services
docker-compose down
```

## 🐛 Troubleshooting

**FFmpeg not found**: Install FFmpeg and add to system PATH
```bash
winget install Gyan.FFmpeg
```

**GPU not detected**: Ensure NVIDIA Docker runtime is installed
```bash
docker run --gpus all nvidia/cuda:12.0-runtime nvidia-smi
```

**Kokoro TTS model missing**: Download manually
```bash
cd kokoro-tts
python download_model.py
```

**YouTube auth fails**: Re-generate token
```bash
cd api
npm run youtube:auth
```

## 📄 License

Private project

## 👤 Author

Built for automated YouTube content creation

## 📞 Support

See SETUP_GUIDE.md for detailed troubleshooting and setup instructions.
