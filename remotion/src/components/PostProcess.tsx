/**
 * PostProcess — cinematic post-processing overlay.
 * Applies letterbox bars, film grain, and mood-based color grading.
 */

import { AbsoluteFill, useCurrentFrame } from 'remotion';
import React from 'react';
import { LETTERBOX_BAR_H } from '../lib/layout';

interface PostProcessProps {
  mood: string;
  letterbox?: boolean;
  grain?: boolean;
}

export const PostProcess: React.FC<PostProcessProps> = ({ mood, letterbox = true, grain = true }) => {
  const frame = useCurrentFrame();
  const gradeFilter = getColorGrade(mood);

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {/* Color grading overlay */}
      <div style={{ position: 'absolute', inset: 0, ...gradeFilter }} />

      {/* Film grain — subtle SVG noise */}
      {grain && (
        <div style={{ position: 'absolute', inset: 0, opacity: 0.04, mixBlendMode: 'overlay' }}>
          <svg width="100%" height="100%">
            <filter id="filmGrain">
              <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" seed={frame % 60} />
              <feColorMatrix type="saturate" values="0" />
            </filter>
            <rect width="100%" height="100%" filter="url(#filmGrain)" />
          </svg>
        </div>
      )}

      {/* Letterbox bars — 2.39:1 cinematic framing */}
      {letterbox && (
        <>
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: LETTERBOX_BAR_H,
              background: '#000000',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: LETTERBOX_BAR_H,
              background: '#000000',
            }}
          />
        </>
      )}
    </AbsoluteFill>
  );
};

function getColorGrade(mood: string): React.CSSProperties {
  // Mood-based CSS filter overlays simulating color LUTs
  switch (mood) {
    case 'tense':
    case 'dramatic':
      return {
        background: 'linear-gradient(180deg, rgba(20,0,0,0.08) 0%, rgba(40,10,5,0.06) 100%)',
        mixBlendMode: 'color' as const,
      };
    case 'mysterious':
    case 'eerie':
      return {
        background: 'linear-gradient(180deg, rgba(0,5,20,0.1) 0%, rgba(5,15,30,0.08) 100%)',
        mixBlendMode: 'color' as const,
      };
    case 'calm':
      return {
        background: 'linear-gradient(180deg, rgba(10,15,5,0.06) 0%, rgba(5,10,15,0.04) 100%)',
        mixBlendMode: 'color' as const,
      };
    case 'melancholic':
      return {
        background: 'linear-gradient(180deg, rgba(5,5,15,0.1) 0%, rgba(10,5,20,0.08) 100%)',
        mixBlendMode: 'color' as const,
      };
    case 'triumphant':
    case 'upbeat':
      return {
        background: 'linear-gradient(180deg, rgba(20,15,0,0.06) 0%, rgba(15,10,0,0.04) 100%)',
        mixBlendMode: 'color' as const,
      };
    default:
      return {};
  }
}
