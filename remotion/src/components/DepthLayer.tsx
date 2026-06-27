import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { parallax } from '../lib/animations';

interface DepthLayerProps {
  background: string;
  sceneType?: string;
  mood: string;
  durationInFrames: number;
}

export const DepthLayer: React.FC<DepthLayerProps> = ({
  background,
  sceneType,
  mood,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const drift = parallax(frame, durationInFrames, 0.18, 'right');
  const dark = mood === 'mysterious' || mood === 'tense' || mood === 'dramatic' || mood === 'eerie';
  const lower = `${background} ${sceneType || ''}`.toLowerCase();

  const showTrees = /forest|graveyard|mountain|suburb|street|rainy|alley/.test(lower);
  const showDesk = /evidence|case_board|timeline/.test(lower);
  const showBars = /prison|tunnel/.test(lower);

  return (
    <AbsoluteFill style={{ pointerEvents: 'none', overflow: 'hidden' }}>
      {showTrees && (
        <>
          <div
            style={{
              position: 'absolute',
              left: -80 + drift,
              top: -40,
              width: 260,
              height: 1180,
              background: 'linear-gradient(90deg, rgba(5,8,8,0.72), rgba(5,8,8,0.05))',
              clipPath: 'polygon(0 0, 52% 0, 28% 100%, 0 100%)',
              filter: 'blur(1px)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              right: -120 - drift,
              top: -60,
              width: 320,
              height: 1180,
              background: 'linear-gradient(270deg, rgba(5,8,8,0.62), rgba(5,8,8,0.04))',
              clipPath: 'polygon(44% 0, 100% 0, 100% 100%, 20% 100%)',
              filter: 'blur(1px)',
            }}
          />
        </>
      )}

      {showDesk && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: -20,
            height: 250,
            background: 'linear-gradient(180deg, rgba(25,18,12,0), rgba(28,18,12,0.86) 42%, rgba(8,6,5,0.96))',
            boxShadow: '0 -24px 60px rgba(0,0,0,0.35)',
          }}
        />
      )}

      {showBars && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'repeating-linear-gradient(90deg, rgba(0,0,0,0.52) 0 22px, transparent 22px 170px)',
            opacity: 0.3,
          }}
        />
      )}

      {dark && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, transparent 38%, rgba(0,0,0,0.42) 100%)',
          }}
        />
      )}
    </AbsoluteFill>
  );
};
