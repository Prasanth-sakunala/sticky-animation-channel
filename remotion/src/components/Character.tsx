import React, { useState } from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import type { CharacterExpression, PoseName } from '../lib/types';
import { resolveCharacter, mapToPose, isAnimal, ALL_CHARACTERS, type CharacterName } from '../lib/asset-resolver';
import { safePosition } from '../lib/layout';
import { walkBob, walkTilt } from '../lib/animations';

function validateCharacterName(name: string): CharacterName {
  if ((ALL_CHARACTERS as readonly string[]).includes(name)) return name as CharacterName;
  return 'marcus'; // safe fallback
}

/** Renders an image that silently hides itself if the asset is missing (404) */
const SafeImg: React.FC<{ src: string; style: React.CSSProperties }> = ({ src, style }) => {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return <img src={src} style={style} alt="" onError={() => setFailed(true)} />;
};

interface CharacterProps {
  characterName: CharacterName;
  pose: string;
  expression: CharacterExpression;
  mood: string;
  placement?: { x: number; y: number; scale: number };
  silhouette?: boolean;
}

export const Character: React.FC<CharacterProps> = ({
  characterName,
  pose,
  expression,
  mood,
  placement,
  silhouette = false,
}) => {
  const frame = useCurrentFrame();

  // Validate character name to prevent 404 on bad AI output
  const validName = validateCharacterName(characterName);

  // Resolve pose: map legacy names + expression to actual extracted pose
  const resolvedPose: PoseName = mapToPose(pose, expression);

  // Get the PNG path
  const imageSrc = resolveCharacter(validName, resolvedPose);

  // Calculate position
  const baseScale = isAnimal(validName) ? 0.7 : 1.0;
  let posStyle: React.CSSProperties;

  if (placement) {
    const safe = safePosition(placement.x, placement.y, placement.scale * baseScale);
    const charW = 400 * safe.safeScale;
    const charH = 500 * safe.safeScale;
    posStyle = {
      position: 'absolute',
      left: safe.x - charW / 2,
      top: safe.y - charH * 0.7,
      width: charW,
      height: charH,
    };
  } else {
    // Default center-bottom placement
    const scale = baseScale * 0.85;
    const charW = 400 * scale;
    const charH = 500 * scale;
    posStyle = {
      position: 'absolute',
      left: 960 - charW / 2,
      bottom: 80,
      width: charW,
      height: charH,
    };
  }

  // Micro-animations: subtle breathing
  const breathScale = 1 + Math.sin(frame * 0.04 * Math.PI) * 0.003;
  const isMovingPose = resolvedPose.includes('walking') || resolvedPose.includes('running');
  const motionY = isMovingPose ? -walkBob(frame, resolvedPose.includes('running') ? 0.34 : 0.22, resolvedPose.includes('running') ? 10 : 5) : 0;
  const motionRotate = isMovingPose ? walkTilt(frame, resolvedPose.includes('running') ? 0.34 : 0.22, 1.6) : 0;

  // Mood-based shadow
  let shadowFilter = 'drop-shadow(0 8px 20px rgba(0,0,0,0.5))';
  if (mood === 'dramatic' || mood === 'tense') {
    shadowFilter = 'drop-shadow(0 6px 24px rgba(180,40,20,0.25))';
  } else if (mood === 'mysterious' || mood === 'eerie') {
    shadowFilter = 'drop-shadow(0 6px 24px rgba(60,40,140,0.25))';
  }

  // Silhouette mode: full black overlay
  const silhouetteStyle: React.CSSProperties = silhouette
    ? { filter: 'brightness(0)', opacity: 0.9 }
    : {};

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div
        style={{
          position: 'absolute',
          left: Number(posStyle.left ?? 0) + Number(posStyle.width ?? 0) * 0.24,
          top: posStyle.top !== undefined
            ? Number(posStyle.top) + Number(posStyle.height ?? 0) * 0.68
            : undefined,
          bottom: posStyle.bottom !== undefined ? Number(posStyle.bottom) + 8 : undefined,
          width: Number(posStyle.width ?? 0) * 0.52,
          height: Math.max(14, Number(posStyle.height ?? 0) * 0.045),
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.38), rgba(0,0,0,0.08) 58%, transparent 72%)',
          filter: 'blur(8px)',
          opacity: silhouette ? 0.5 : 0.72,
          transform: 'translateY(12px)',
        }}
      />
      <div
        style={{
          ...posStyle,
          transform: `translateY(${motionY}px) rotate(${motionRotate}deg) scaleY(${breathScale})`,
          transformOrigin: 'center bottom',
          filter: shadowFilter,
        }}
      >
        <SafeImg
          src={imageSrc}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            objectPosition: 'center bottom',
            ...silhouetteStyle,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
