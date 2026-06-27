import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from 'remotion';
import { shake as shakeAnim } from '../lib/animations';
import type { CameraMovement } from '../lib/types';

interface CameraProps {
  movement: CameraMovement;
  durationInFrames: number;
  mood?: string;
  focalPoint?: { x: number; y: number }; // 0-100 percentage
  intensity?: 'subtle' | 'moderate' | 'dramatic';
  children: React.ReactNode;
}

// Premium cubic-bezier easing — smooth cinematic feel
const CINEMATIC_EASE = Easing.bezier(0.25, 0.1, 0.25, 1);

export const Camera: React.FC<CameraProps> = ({
  movement,
  durationInFrames,
  mood,
  focalPoint = { x: 50, y: 45 },
  intensity = 'moderate',
  children,
}) => {
  const frame = useCurrentFrame();

  let intMul = 0.6;
  if (intensity === 'dramatic') intMul = 1.4;
  else if (intensity === 'moderate') intMul = 1;

  // Ken Burns base — every scene gets a slow micro-zoom (never truly static)
  const kenBurnsScale = interpolate(frame, [0, durationInFrames], [1, 1 + 0.04 * intMul], {
    easing: CINEMATIC_EASE,
    extrapolateRight: 'clamp',
  });

  // Focal drift — camera slowly drifts toward focal point
  const driftX = interpolate(frame, [0, durationInFrames], [0, ((focalPoint.x - 50) / 50) * 12 * intMul], {
    easing: CINEMATIC_EASE,
    extrapolateRight: 'clamp',
  });
  const driftY = interpolate(frame, [0, durationInFrames], [0, ((focalPoint.y - 50) / 50) * 8 * intMul], {
    easing: CINEMATIC_EASE,
    extrapolateRight: 'clamp',
  });

  let extraTransform = '';
  let origin = `${focalPoint.x}% ${focalPoint.y}%`;

  switch (movement) {
    case 'slow_zoom_in': {
      let zoomAdd = 0.05;
      if (intensity === 'dramatic') zoomAdd = 0.12;
      else if (intensity === 'moderate') zoomAdd = 0.08;
      const zoomMax = 1 + zoomAdd;
      const scale = interpolate(frame, [0, durationInFrames], [1, zoomMax], {
        easing: CINEMATIC_EASE,
        extrapolateRight: 'clamp',
      });
      extraTransform = `scale(${scale})`;
      break;
    }
    case 'slow_zoom_out': {
      const scale = interpolate(frame, [0, durationInFrames], [1.08, 1], {
        easing: CINEMATIC_EASE,
        extrapolateRight: 'clamp',
      });
      extraTransform = `scale(${scale})`;
      break;
    }
    case 'pan_left': {
      const x = interpolate(frame, [0, durationInFrames], [0, -60 * intMul], {
        easing: CINEMATIC_EASE,
        extrapolateRight: 'clamp',
      });
      extraTransform = `translateX(${x}px)`;
      break;
    }
    case 'pan_right': {
      const x = interpolate(frame, [0, durationInFrames], [0, 60 * intMul], {
        easing: CINEMATIC_EASE,
        extrapolateRight: 'clamp',
      });
      extraTransform = `translateX(${x}px)`;
      break;
    }
    case 'drift_up': {
      const y = interpolate(frame, [0, durationInFrames], [0, -40 * intMul], {
        easing: CINEMATIC_EASE,
        extrapolateRight: 'clamp',
      });
      extraTransform = `translateY(${y}px)`;
      break;
    }
    case 'dolly_in': {
      // Dolly — combined zoom + slight vertical drift (camera physically moves forward)
      const dollyScale = interpolate(frame, [0, durationInFrames], [1, 1.15 * intMul], {
        easing: CINEMATIC_EASE,
        extrapolateRight: 'clamp',
      });
      const dollyY = interpolate(frame, [0, durationInFrames], [0, -15 * intMul], {
        easing: CINEMATIC_EASE,
        extrapolateRight: 'clamp',
      });
      extraTransform = `scale(${dollyScale}) translateY(${dollyY}px)`;
      break;
    }
    case 'orbit': {
      // Slight circular path around focal point
      const angle = interpolate(frame, [0, durationInFrames], [0, Math.PI * 0.15 * intMul], {
        easing: CINEMATIC_EASE,
        extrapolateRight: 'clamp',
      });
      const orbitX = Math.sin(angle) * 30 * intMul;
      const orbitY = Math.cos(angle) * 12 * intMul - 12 * intMul;
      extraTransform = `translate(${orbitX}px, ${orbitY}px)`;
      break;
    }
    case 'push_in': {
      // Fast, punchy zoom for impact moments
      const pushScale = interpolate(frame, [0, durationInFrames * 0.4], [1, 1.2 * intMul], {
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        extrapolateRight: 'clamp',
      });
      extraTransform = `scale(${pushScale})`;
      break;
    }
    case 'pull_back': {
      // Quick pull-back reveal
      const pullScale = interpolate(frame, [0, durationInFrames * 0.5], [1.2, 1], {
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        extrapolateRight: 'clamp',
      });
      extraTransform = `scale(${pullScale})`;
      break;
    }
    case 'tilt_up': {
      const tiltY = interpolate(frame, [0, durationInFrames], [20 * intMul, -30 * intMul], {
        easing: CINEMATIC_EASE,
        extrapolateRight: 'clamp',
      });
      extraTransform = `translateY(${tiltY}px)`;
      break;
    }
    case 'tilt_down': {
      const tiltY = interpolate(frame, [0, durationInFrames], [-20 * intMul, 25 * intMul], {
        easing: CINEMATIC_EASE,
        extrapolateRight: 'clamp',
      });
      extraTransform = `translateY(${tiltY}px)`;
      break;
    }
    case 'crane_up': {
      // Crane shot — zoom out + drift up simultaneously
      const craneScale = interpolate(frame, [0, durationInFrames], [1.1, 1], {
        easing: CINEMATIC_EASE,
        extrapolateRight: 'clamp',
      });
      const craneY = interpolate(frame, [0, durationInFrames], [15, -35 * intMul], {
        easing: CINEMATIC_EASE,
        extrapolateRight: 'clamp',
      });
      extraTransform = `scale(${craneScale}) translateY(${craneY}px)`;
      break;
    }
    case 'shake': {
      const shakeIntensity = mood === 'dramatic' || mood === 'tense' ? 5 : 3;
      const { x, y } = shakeAnim(frame, shakeIntensity);
      const decay = Math.max(0.2, 1 - frame / (durationInFrames * 0.7));
      extraTransform = `translate(${x * decay}px, ${y * decay}px)`;
      break;
    }
    case 'static':
    default:
      // Static still gets Ken Burns + focal drift (above)
      break;
  }

  // Combine: Ken Burns base + focal drift + movement-specific transform
  const transform = `scale(${kenBurnsScale}) translate(${driftX}px, ${driftY}px) ${extraTransform}`.trim();

  return (
    <AbsoluteFill style={{ transform, transformOrigin: origin, willChange: 'transform' }}>
      {children}
    </AbsoluteFill>
  );
};
