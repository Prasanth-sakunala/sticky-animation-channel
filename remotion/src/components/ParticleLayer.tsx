import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { particlePosition } from '../lib/animations';

interface ParticleLayerProps {
  type: 'snow' | 'rain' | 'dust' | 'embers';
  intensity: 'light' | 'medium' | 'heavy';
  durationInFrames: number;
}

const PARTICLE_COUNTS = { light: 40, medium: 80, heavy: 140 };

const PARTICLE_STYLES: Record<ParticleLayerProps['type'], { color: string; size: [number, number]; speed: number; shape: 'circle' | 'line' | 'dot' }> = {
  snow: { color: '#ffffff', size: [3, 8], speed: 0.8, shape: 'circle' },
  rain: { color: '#a8d4f0', size: [2, 4], speed: 2.5, shape: 'line' },
  dust: { color: '#d4a86c', size: [2, 5], speed: 0.3, shape: 'dot' },
  embers: { color: '#ff8844', size: [2, 6], speed: -0.6, shape: 'circle' },
};

export const ParticleLayer = ({ type, intensity, durationInFrames }: ParticleLayerProps) => {
  const frame = useCurrentFrame();
  const count = PARTICLE_COUNTS[intensity];
  const style = PARTICLE_STYLES[type];

  return (
    <AbsoluteFill style={{ pointerEvents: 'none', overflow: 'hidden' }}>
      <svg
        viewBox="0 0 1920 1080"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        preserveAspectRatio="none"
      >
        {Array.from({ length: count }).map((_, i) => {
          const speed = style.speed * (0.7 + (i % 5) * 0.12);
          const pos = particlePosition(i, frame, 1920, 1080, Math.abs(speed));
          const goingUp = style.speed < 0;
          const finalY = goingUp ? 1080 - pos.y : pos.y;
          const seed = i * 137.5;
          const size = style.size[0] + ((seed * 3.7) % (style.size[1] - style.size[0]));

          if (style.shape === 'line') {
            return (
              <line
                key={`particle-${i}`}
                x1={pos.x}
                y1={finalY}
                x2={pos.x + 1}
                y2={finalY + size * 5}
                stroke={style.color}
                strokeWidth={size * 0.8}
                opacity={pos.opacity * 0.9}
                strokeLinecap="round"
              />
            );
          }

          return (
            <circle
              key={`particle-${i}`}
              cx={pos.x}
              cy={finalY}
              r={size}
              fill={style.color}
              opacity={pos.opacity * (type === 'embers' ? 0.95 : 0.85)}
            />
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
