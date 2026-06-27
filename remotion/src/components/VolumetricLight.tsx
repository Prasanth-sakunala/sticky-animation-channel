/**
 * VolumetricLight — projects gradient-based lighting overlays
 * over the scene to simulate directional/spotlight/rim lighting.
 * Positioned absolutely over midground + character layers.
 */

import { AbsoluteFill } from 'remotion';
import React from 'react';

interface VolumetricLightProps {
  type: 'ambient' | 'directional' | 'spotlight' | 'rim_light' | 'backlit';
  direction: 'top_left' | 'top_right' | 'bottom_left' | 'bottom_right' | 'center' | 'behind';
  color: string;
  intensity: number; // 0.0 - 1.0
}

export const VolumetricLight: React.FC<VolumetricLightProps> = ({ type, direction, color, intensity }) => {
  const gradient = buildGradient(type, direction, color, intensity);

  return (
    <AbsoluteFill style={{ pointerEvents: 'none', mixBlendMode: 'screen' }}>
      {/* Primary light cast */}
      <div style={{ position: 'absolute', inset: 0, background: gradient.light }} />
      {/* Shadow mask — opposite side gets darkened */}
      <div style={{ position: 'absolute', inset: 0, background: gradient.shadow, mixBlendMode: 'multiply' }} />
    </AbsoluteFill>
  );
};

function buildGradient(
  type: string,
  direction: string,
  color: string,
  intensity: number
): { light: string; shadow: string } {
  const alpha = (intensity * 0.35).toFixed(2);
  const shadowAlpha = (intensity * 0.5).toFixed(2);
  const pos = directionToPosition(direction);


  switch (type) {
    case 'spotlight':
      return {
        light: `radial-gradient(ellipse at ${pos}, ${hexToRgba(color, alpha)} 0%, transparent 50%)`,
        shadow: `radial-gradient(ellipse at ${pos}, transparent 30%, rgba(0,0,0,${shadowAlpha}) 100%)`,
      };
    case 'directional':
      return {
        light: `linear-gradient(${directionToDeg(direction)}, ${hexToRgba(color, alpha)} 0%, transparent 60%)`,
        shadow: `linear-gradient(${directionToDeg(oppositeDirection(direction))}, rgba(0,0,0,${shadowAlpha}) 0%, transparent 50%)`,
      };
    case 'rim_light':
      return {
        light: `radial-gradient(ellipse at ${pos}, ${hexToRgba(color, (intensity * 0.25).toFixed(2))} 0%, transparent 35%)`,
        shadow: `radial-gradient(ellipse at center, rgba(0,0,0,${(intensity * 0.4).toFixed(2)}) 20%, transparent 70%)`,
      };
    case 'backlit':
      return {
        light: `radial-gradient(ellipse at 50% 50%, ${hexToRgba(color, (intensity * 0.2).toFixed(2))} 0%, transparent 45%)`,
        shadow: `radial-gradient(ellipse at 50% 50%, rgba(0,0,0,${(intensity * 0.6).toFixed(2)}) 0%, transparent 60%)`,
      };
    case 'ambient':
    default:
      return {
        light: `radial-gradient(ellipse at center, ${hexToRgba(color, (intensity * 0.15).toFixed(2))} 0%, transparent 70%)`,
        shadow: `radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,${(intensity * 0.25).toFixed(2)}) 100%)`,
      };
  }
}

function directionToPosition(dir: string): string {
  switch (dir) {
    case 'top_left': return '20% 20%';
    case 'top_right': return '80% 20%';
    case 'bottom_left': return '20% 80%';
    case 'bottom_right': return '80% 80%';
    case 'center': return '50% 50%';
    case 'behind': return '50% 50%';
    default: return '50% 30%';
  }
}

function directionToDeg(dir: string): string {
  switch (dir) {
    case 'top_left': return '135deg';
    case 'top_right': return '225deg';
    case 'bottom_left': return '45deg';
    case 'bottom_right': return '315deg';
    case 'center': return '180deg';
    case 'behind': return '0deg';
    default: return '180deg';
  }
}

function oppositeDirection(dir: string): string {
  switch (dir) {
    case 'top_left': return 'bottom_right';
    case 'top_right': return 'bottom_left';
    case 'bottom_left': return 'top_right';
    case 'bottom_right': return 'top_left';
    case 'center': return 'center';
    case 'behind': return 'center';
    default: return 'center';
  }
}

function hexToRgba(hex: string, alpha: string): string {
  const h = (hex || '#ffffff').replace('#', '');
  const r = Number.parseInt(h.substring(0, 2), 16) || 0;
  const g = Number.parseInt(h.substring(2, 4), 16) || 0;
  const b = Number.parseInt(h.substring(4, 6), 16) || 0;
  return `rgba(${r},${g},${b},${alpha})`;
}
