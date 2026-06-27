import React, { useState } from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { resolveBackgroundFromDescription } from '../lib/asset-resolver';

interface BackgroundProps {
  name: string;
  narrationText: string;
  objects: string[];
  mood: string;
  textOverlay?: string | null;
  durationInFrames: number;
}

const MOOD_COLORS: Record<string, string> = {
  tense: '#1a0a0a',
  mysterious: '#0a0a1a',
  calm: '#1a2a1a',
  dramatic: '#2a0a0a',
  upbeat: '#1a1a0a',
  eerie: '#0a1a0a',
  melancholic: '#0a0a2a',
  triumphant: '#1a1a00',
};

/** Renders the background image with a mood-colored fallback if the PNG is missing */
const BackgroundImage: React.FC<{ src: string; mood: string }> = ({ src, mood }) => {
  const [failed, setFailed] = useState(false);
  const fallbackColor = MOOD_COLORS[mood] || '#1a1a2e';

  if (failed) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        background: `radial-gradient(ellipse at center, ${fallbackColor}dd 0%, ${fallbackColor} 100%)`,
      }} />
    );
  }

  return (
    <img
      src={src}
      onError={() => setFailed(true)}
      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
    />
  );
};

export const Background: React.FC<BackgroundProps> = ({ name, mood, durationInFrames }) => {
  const frame = useCurrentFrame();

  // Resolve background name to actual PNG asset
  const bgSrc = resolveBackgroundFromDescription(name);

  // Mood-based overlays
  const isNight = mood === 'mysterious' || mood === 'tense' || mood === 'eerie';
  const nightOpacity = isNight ? 0.35 : 0;

  // Fog drift for atmospheric moods
  const fogX = Math.sin(frame * 0.04) * 80;
  const showFog = mood === 'mysterious' || mood === 'eerie';

  return (
    <AbsoluteFill>
      {/* Background image — full cover, with color fallback */}
      <BackgroundImage src={bgSrc} mood={mood} />

      {/* Night/darkness overlay */}
      {nightOpacity > 0 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(180deg, rgba(5,3,20,${nightOpacity}) 0%, rgba(10,8,30,${nightOpacity * 0.7}) 100%)`,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Mood color grade overlay */}
      {mood === 'dramatic' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(60,10,10,0.15) 0%, rgba(20,5,5,0.1) 100%)',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Fog/mist layer */}
      {showFog && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          <div
            style={{
              position: 'absolute',
              bottom: '5%',
              left: '-20%',
              width: '140%',
              height: '35%',
              background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.2) 0%, transparent 60%)',
              transform: `translateX(${fogX}px)`,
              filter: 'blur(20px)',
            }}
          />
        </div>
      )}

      {/* Cinematic vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.5) 100%)',
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  );
};
