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
    <AbsoluteFill style={{ justifyContent: 'flex-start', alignItems: 'flex-start', padding: 56 }}>
      <div
        style={{
          backgroundColor: 'rgba(10, 10, 20, 0.82)',
          padding: '10px 18px',
          borderRadius: 10,
          transform: `translateY(${translateY}px) scale(${scale})`,
          opacity,
          borderLeft: '3px solid #f0c040',
          boxShadow: '0 6px 24px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          maxWidth: 600,
        }}
      >
        <span
          style={{
            color: '#ffffff',
            fontSize: 24,
            fontFamily: 'Georgia, Times New Roman, serif',
            fontWeight: 600,
            letterSpacing: 0.6,
            textShadow: '0 2px 6px rgba(0,0,0,0.6)',
          }}
        >
          {text}
        </span>
      </div>
    </AbsoluteFill>
  );
};
