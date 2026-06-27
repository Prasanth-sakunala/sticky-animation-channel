import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from 'remotion';
import type { TransitionType } from '../lib/types';

interface TransitionLayerProps {
  transition: TransitionType;
  durationInFrames: number;
}

const TRANSITION_FRAMES = 15; // ~0.5s at 30fps

/**
 * TransitionLayer — renders entrance transitions for a scene.
 * Placed as a wrapper around scene content, it animates the
 * scene's entrance based on the transition type.
 */
export const TransitionLayer: React.FC<TransitionLayerProps & { children: React.ReactNode }> = ({
  transition,
  durationInFrames,
  children,
}) => {
  const frame = useCurrentFrame();
  const t = Math.min(1, frame / TRANSITION_FRAMES); // 0→1 over transition duration

  const style = getTransitionStyle(transition, frame, t, durationInFrames);

  return (
    <AbsoluteFill style={style.wrapper}>
      {children}
      {style.overlay && <div style={style.overlay} />}
    </AbsoluteFill>
  );
};

function getTransitionStyle(
  transition: TransitionType,
  frame: number,
  t: number,
  durationInFrames: number
): { wrapper: React.CSSProperties; overlay?: React.CSSProperties } {
  switch (transition) {
    case 'fade': {
      const opacity = interpolate(frame, [0, TRANSITION_FRAMES], [0, 1], {
        easing: Easing.out(Easing.ease),
        extrapolateRight: 'clamp',
      });
      return { wrapper: { opacity } };
    }

    case 'slide_left': {
      const x = interpolate(frame, [0, TRANSITION_FRAMES], [1920, 0], {
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        extrapolateRight: 'clamp',
      });
      return { wrapper: { transform: `translateX(${x}px)` } };
    }

    case 'dissolve': {
      // Cross-dissolve with slight scale
      const opacity = interpolate(frame, [0, TRANSITION_FRAMES * 1.2], [0, 1], {
        easing: Easing.inOut(Easing.ease),
        extrapolateRight: 'clamp',
      });
      const scale = interpolate(frame, [0, TRANSITION_FRAMES], [1.02, 1], {
        easing: Easing.out(Easing.ease),
        extrapolateRight: 'clamp',
      });
      return { wrapper: { opacity, transform: `scale(${scale})` } };
    }

    case 'wipe_right': {
      // Clip-path wipe reveal from left to right
      const progress = interpolate(frame, [0, TRANSITION_FRAMES], [0, 100], {
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        extrapolateRight: 'clamp',
      });
      return {
        wrapper: {
          clipPath: `inset(0 ${100 - progress}% 0 0)`,
        },
      };
    }

    case 'zoom_in': {
      // Zooms in from a small point to full frame
      const scale = interpolate(frame, [0, TRANSITION_FRAMES], [0.3, 1], {
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        extrapolateRight: 'clamp',
      });
      const opacity = interpolate(frame, [0, TRANSITION_FRAMES * 0.5], [0, 1], {
        extrapolateRight: 'clamp',
      });
      return { wrapper: { transform: `scale(${scale})`, opacity } };
    }

    case 'blur': {
      // Start blurred, sharpen into focus
      const blur = interpolate(frame, [0, TRANSITION_FRAMES], [20, 0], {
        easing: Easing.out(Easing.ease),
        extrapolateRight: 'clamp',
      });
      const opacity = interpolate(frame, [0, TRANSITION_FRAMES * 0.4], [0.5, 1], {
        extrapolateRight: 'clamp',
      });
      return { wrapper: { filter: `blur(${blur}px)`, opacity } };
    }

    case 'glitch': {
      // RGB split + horizontal displacement glitch effect
      if (frame >= TRANSITION_FRAMES) {
        return { wrapper: {} };
      }
      const glitchIntensity = interpolate(frame, [0, TRANSITION_FRAMES], [1, 0], {
        extrapolateRight: 'clamp',
      });
      const offsetX = Math.sin(frame * 2.5) * 15 * glitchIntensity;
      const skew = Math.sin(frame * 3.1) * 2 * glitchIntensity;
      return {
        wrapper: {
          transform: `translateX(${offsetX}px) skewX(${skew}deg)`,
        },
        overlay: {
          position: 'absolute',
          inset: 0,
          background: `repeating-linear-gradient(0deg, transparent 0px, transparent 3px, rgba(0,255,100,${0.06 * glitchIntensity}) 3px, rgba(0,255,100,${0.06 * glitchIntensity}) 4px)`,
          mixBlendMode: 'screen' as const,
          pointerEvents: 'none' as const,
          opacity: glitchIntensity,
        },
      };
    }

    case 'whip_pan': {
      // Fast horizontal motion blur sweep
      const progress = interpolate(frame, [0, TRANSITION_FRAMES * 0.6], [0, 1], {
        easing: Easing.bezier(0.7, 0, 0.3, 1),
        extrapolateRight: 'clamp',
      });
      const x = interpolate(progress, [0, 0.5, 1], [-800, 0, 0]);
      const motionBlur = interpolate(progress, [0, 0.3, 0.7, 1], [30, 20, 5, 0]);
      return {
        wrapper: {
          transform: `translateX(${x}px)`,
          filter: `blur(${motionBlur}px)`,
        },
      };
    }

    case 'cut':
    default:
      return { wrapper: {} };
  }
}
