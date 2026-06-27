/**
 * EnvironmentLayer — 4-depth parallax background renderer.
 * Each layer moves at different speeds relative to camera drift.
 * Uses asset tokens from the composition brief to render scene-specific SVGs.
 */

import { AbsoluteFill, useCurrentFrame } from 'remotion';
import React from 'react';
import { PARALLAX_DEPTHS, FRAME_W, FRAME_H } from '../lib/layout';
import {
  renderSkyToken,
  renderFarToken,
  renderMidToken,
  renderFgToken,
  renderSkyGradientDefs,
} from '../lib/asset-tokens';

type Palette = [string, string, string, string, string];

interface EnvironmentLayerProps {
  palette: Palette;
  skyTokens: string[];
  farTokens: string[];
  midTokens: string[];
  fgTokens: string[];
  cameraMovement: string;
  cameraIntensity: 'subtle' | 'moderate' | 'dramatic';
  focalPoint: { x: number; y: number };
  durationInFrames: number;
  mood: string;
}

export const EnvironmentLayer: React.FC<EnvironmentLayerProps> = ({
  palette,
  skyTokens,
  farTokens,
  midTokens,
  fgTokens,
  cameraMovement,
  cameraIntensity,
  focalPoint,
  durationInFrames,
  mood,
}) => {
  const frame = useCurrentFrame();

  // Calculate parallax offsets based on camera movement direction
  const progress = frame / durationInFrames;
  let intensityMul = 0.6;
  if (cameraIntensity === 'dramatic') intensityMul = 1.5;
  else if (cameraIntensity === 'moderate') intensityMul = 1;

  // Focal drift direction
  const driftX = ((focalPoint.x - 50) / 50) * 30 * intensityMul;
  const driftY = ((focalPoint.y - 50) / 50) * 15 * intensityMul;

  function layerTransform(depth: number): string {
    const px = progress * driftX * depth;
    const py = progress * driftY * depth;
    return `translate(${-px}px, ${-py}px)`;
  }

  // Fog overlay for moody scenes
  const showFog = fgTokens.includes('frame_fog') || mood === 'mysterious' || mood === 'eerie';
  const fogDrift = Math.sin(frame * 0.02) * 80;

  return (
    <AbsoluteFill>
      {/* ─── LAYER 1: SKY / ATMOSPHERE ─────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: layerTransform(PARALLAX_DEPTHS.sky),
          willChange: 'transform',
        }}
      >
        <svg viewBox={`0 0 ${FRAME_W} ${FRAME_H}`} style={{ position: 'absolute', width: '100%', height: '100%' }}>
          <defs>{renderSkyGradientDefs(palette)}</defs>
          {/* Base sky fill */}
          <rect width={FRAME_W} height={FRAME_H} fill={palette[0]} />
          {skyTokens.map((token) => renderSkyToken(token, palette, frame))}
        </svg>
      </div>

      {/* ─── LAYER 2: FAR BACKGROUND (silhouettes) ────────────── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: layerTransform(PARALLAX_DEPTHS.far),
          willChange: 'transform',
        }}
      >
        <svg viewBox={`0 0 ${FRAME_W} ${FRAME_H}`} style={{ position: 'absolute', width: '100%', height: '100%' }}>
          {farTokens.map((token) => renderFarToken(token, palette, frame))}
        </svg>
      </div>

      {/* ─── LAYER 3: MIDGROUND (action layer) ────────────────── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: layerTransform(PARALLAX_DEPTHS.mid),
          willChange: 'transform',
        }}
      >
        <svg viewBox={`0 0 ${FRAME_W} ${FRAME_H}`} style={{ position: 'absolute', width: '100%', height: '100%' }}>
          {midTokens.map((token) => renderMidToken(token, palette, frame))}
        </svg>
      </div>

      {/* ─── LAYER 4: FOREGROUND (framing) ────────────────────── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: layerTransform(PARALLAX_DEPTHS.fg),
          willChange: 'transform',
        }}
      >
        <svg viewBox={`0 0 ${FRAME_W} ${FRAME_H}`} style={{ position: 'absolute', width: '100%', height: '100%' }}>
          {fgTokens.map((token) => renderFgToken(token, palette, frame))}
        </svg>
      </div>

      {/* ─── FOG/MIST OVERLAY ─────────────────────────────────── */}
      {showFog && (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <div
            style={{
              position: 'absolute',
              bottom: '5%',
              left: '-20%',
              width: '140%',
              height: '35%',
              background: `radial-gradient(ellipse at center, rgba(200,210,220,0.2) 0%, transparent 65%)`,
              transform: `translateX(${fogDrift}px)`,
              filter: 'blur(30px)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '0%',
              left: '-10%',
              width: '120%',
              height: '22%',
              background: `radial-gradient(ellipse at center, rgba(150,170,190,0.15) 0%, transparent 55%)`,
              transform: `translateX(${-fogDrift * 0.6}px)`,
              filter: 'blur(25px)',
            }}
          />
        </div>
      )}

      {/* ─── CINEMATIC VIGNETTE ───────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.55) 100%)',
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  );
};
