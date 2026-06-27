FROM node:20-slim AS api-builder

WORKDIR /app/api

COPY api/package.json ./package.json
COPY api/tsconfig.json ./tsconfig.json
RUN npm install

COPY api/src ./src
RUN npm run build

FROM node:20-slim AS runtime

RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    python3-pip \
    libnss3 \
    libnspr4 \
    libdbus-1-3 \
    libatk1.0-0 \
    libgbm-dev \
    libasound2 \
    libxrandr2 \
    libxkbcommon-dev \
    libxfixes3 \
    libxcomposite1 \
    libxdamage1 \
    libpango-1.0-0 \
    libcairo2 \
    libcups2 \
    libatk-bridge2.0-0 \
    && pip3 install edge-tts --break-system-packages \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY api/package.json /app/api/package.json
RUN cd /app/api && npm install --omit=dev

COPY --from=api-builder /app/api/dist /app/api/dist

COPY remotion/package.json /app/remotion/package.json
RUN cd /app/remotion && npm install --omit=dev
COPY remotion /app/remotion

EXPOSE 8002

WORKDIR /app/api
CMD ["node", "dist/index.js"]
