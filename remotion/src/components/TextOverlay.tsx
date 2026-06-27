import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { springIn, easeOut } from '../lib/animations';

interface TextOverlayProps {
  text: string;
  durationInFrames: number;
}

export const TextOverlay: React.FC<TextOverlayProps> = ({ text, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Spring entrance
  const enter = springIn(frame, fps, 3);
  const translateY = (1 - enter) * 60;
  const scale = 0.85 + enter * 0.15;

  // Fade out near end
  const fadeOut = easeOut(frame, durationInFrames - 15, durationInFrames, 1, 0);
  const opacity = Math.min(enter, fadeOut);

  if (opacity <= 0) return null;

  return (
    <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'center', padding: 60 }}>
      <div
        style={{
          backgroundColor: 'rgba(10, 10, 20, 0.82)',
          padding: '18px 44px',
          borderRadius: 10,
          transform: `translateY(${translateY}px) scale(${scale})`,
          opacity,
          borderLeft: '4px solid #f0c040',
          boxShadow: '0 6px 24px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
        }}
      >
        <span
          style={{
            color: '#ffffff',
            fontSize: 36,
            fontFamily: 'Arial, sans-serif',
            fontWeight: 600,
            letterSpacing: 1,
            textShadow: '0 2px 6px rgba(0,0,0,0.6)',
          }}
        >
          {text}
        </span>
      </div>
    </AbsoluteFill>
  );
};
