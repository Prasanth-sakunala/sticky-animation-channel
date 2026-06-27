import React, { useState } from 'react';
import { AbsoluteFill, useCurrentFrame, staticFile } from 'remotion';
import { springIn, easeOut } from '../lib/animations';

interface ObjectLayerProps {
  objects: string[];
  durationInFrames: number;
  mood?: string;
  sceneType?: string;
  narrationText?: string;
  background?: string;
  characterPlacement?: { x: number; y: number; scale: number };
  /** Audio-synced frames when objects should appear (from audio-sync) */
  objectFrames?: number[];
}

type Placement = { x: number; y: number; rotate: number; size: number };

const EVIDENCE_POSITIONS = [
  { x: 42, y: 44, rotate: -4, size: 280 },
  { x: 58, y: 50, rotate: 5, size: 230 },
  { x: 50, y: 60, rotate: 0, size: 210 },
];

const CASE_BOARD_POSITIONS = [
  { x: 30, y: 34, rotate: -6, size: 170 },
  { x: 52, y: 39, rotate: 3, size: 150 },
  { x: 70, y: 35, rotate: 8, size: 160 },
];

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function classifyObjectKind(objectName: string): 'vehicle' | 'weapon' | 'document' | 'handheld' | 'furniture' | 'misc' {
  const name = objectName.toLowerCase();
  if (name.includes('car') || name.includes('truck') || name.includes('ambulance')) return 'vehicle';
  if (name.includes('knife') || name.includes('gun') || name.includes('axe') || name.includes('crowbar') || name.includes('rope')) return 'weapon';
  if (name.includes('newspaper') || name.includes('photo') || name.includes('diary') || name.includes('envelope') || name.includes('letter')) return 'document';
  if (name.includes('phone') || name.includes('flashlight') || name.includes('key') || name.includes('ring') || name.includes('box') || name.includes('suitcase')) return 'handheld';
  if (name.includes('chair') || name.includes('lamp') || name.includes('mirror')) return 'furniture';
  return 'misc';
}

function sideX(index: number, leftX: number, rightX: number): number {
  return index % 2 === 0 ? leftX : rightX;
}

function isRoadLike(text: string, bg: string): boolean {
  return /highway|street|road|alley|bridge/.test(bg) || /\b(road|street|path|trail|bridge)\b/.test(text);
}

function isMountainLike(text: string, bg: string): boolean {
  return /mountain|cliff|hill/.test(bg) || /\b(mountain|cliff|hill)\b/.test(text);
}

function isIndoor(bg: string): boolean {
  return /office|room|kitchen|hallway|hospital|court|station|warehouse|prison/.test(bg);
}

function placementForVehicle(index: number, roadLike: boolean, mountainLike: boolean): Placement {
  const x = roadLike ? sideX(index, 24, 76) : sideX(index, 18, 82);
  return {
    x,
    y: mountainLike ? 74 : 72,
    rotate: sideX(index, -2, 2),
    size: roadLike ? 250 : 220,
  };
}

function placementNearCharacter(index: number, characterX: number, characterY: number, spread: number, size: number): Placement {
  const side = index % 2 === 0 ? -1 : 1;
  return {
    x: clamp(characterX + side * spread, 16, 84),
    y: clamp(characterY - 6 + index * 2, 40, 78),
    rotate: sideX(index, -8, 8),
    size,
  };
}

function placementForFurniture(index: number, indoor: boolean): Placement {
  const x = indoor ? sideX(index, 28, 72) : sideX(index, 22, 78);
  return {
    x,
    y: indoor ? 70 : 74,
    rotate: sideX(index, -4, 4),
    size: 180,
  };
}

function getSemanticPlacement(
  objectName: string,
  index: number,
  narrationText: string,
  background: string,
  characterPlacement?: { x: number; y: number; scale: number }
): Placement {
  const text = (narrationText || '').toLowerCase();
  const bg = (background || '').toLowerCase();
  const kind = classifyObjectKind(objectName);

  const characterX = clamp(characterPlacement?.x ?? 50, 20, 80);
  const characterY = clamp(characterPlacement?.y ?? 62, 48, 74);
  const roadLike = isRoadLike(text, bg);
  const mountainLike = isMountainLike(text, bg);
  const indoor = isIndoor(bg);

  if (kind === 'vehicle') {
    return placementForVehicle(index, roadLike, mountainLike);
  }

  if (kind === 'handheld' || kind === 'document') {
    return placementNearCharacter(index, characterX, characterY, 14, kind === 'document' ? 128 : 116);
  }

  if (kind === 'weapon') {
    const base = placementNearCharacter(index, characterX, characterY, 18, 140);
    return { ...base, y: clamp(characterY + 4, 54, 78), rotate: sideX(index, -14, 14) };
  }

  if (kind === 'furniture') {
    return placementForFurniture(index, indoor);
  }

  return {
    x: clamp(characterX + (index % 2 === 0 ? -22 : 22), 12, 88),
    y: mountainLike ? 72 : 68,
    rotate: sideX(index, -6, 6),
    size: 120,
  };
}

/** Map common AI-generated object names to actual asset filenames */
const OBJECT_NAME_MAP: Record<string, string> = {
  'knife': 'obj01_knife',
  'gun': 'obj02_handgun',
  'handgun': 'obj02_handgun',
  'pistol': 'obj02_handgun',
  'baseball_bat': 'obj03_baseball_bat',
  'bat': 'obj03_baseball_bat',
  'rope': 'obj04_rope',
  'axe': 'obj05_axe',
  'crowbar': 'obj06_crowbar',
  'car': 'obj07_car_sedan',
  'police_car': 'obj08_police_car',
  'truck': 'obj09_pickup_truck',
  'pickup_truck': 'obj09_pickup_truck',
  'ambulance': 'obj10_ambulance',
  'smartphone': 'obj11_smartphone',
  'phone': 'obj11_smartphone',
  'laptop': 'obj12_laptop',
  'envelope': 'obj13_envelope',
  'letter': 'obj13_envelope',
  'landline_phone': 'obj14_landline_phone',
  'flashlight': 'obj15_flashlight',
  'flashlight_beam': 'obj15_flashlight',
  'key': 'obj16_key_ornate',
  'bloody_handprint': 'obj17_bloody_handprint',
  'diary': 'obj18_diary',
  'journal': 'obj18_diary',
  'book': 'obj18_diary',
  'photograph': 'obj19_photograph',
  'photo': 'obj19_photograph',
  'locked_box': 'obj20_locked_box',
  'box': 'obj20_locked_box',
  'chair': 'obj21_chair',
  'suitcase': 'obj22_suitcase',
  'clock': 'obj23_clock',
  'lamp': 'obj24_lamp',
  'mirror': 'obj25_mirror',
  'money': 'obj26_money_stack',
  'money_stack': 'obj26_money_stack',
  'pill_bottle': 'obj27_pill_bottle',
  'pills': 'obj27_pill_bottle',
  'wedding_ring': 'obj28_wedding_ring',
  'ring': 'obj28_wedding_ring',
  'backpack': 'obj29_backpack',
  'teddy_bear': 'obj30_teddy_bear',
  'newspaper': 'obj32_newspaper',
  'music_box': 'obj33_music_box',
  'wooden music box': 'obj33_music_box',
  'bird': 'obj34_carved_bird',
  'carved bird': 'obj34_carved_bird',
};

function resolveObjectName(name: string): string {
  const mapped = OBJECT_NAME_MAP[name] || name;
  return mapped;
}

/** A graceful image that hides itself on load error instead of crashing */
const SafeObjectImg: React.FC<{ src: string; style: React.CSSProperties }> = ({ src, style }) => {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <img
      src={src}
      style={style}
      alt=""
      onError={() => setFailed(true)}
    />
  );
};

export const ObjectLayer: React.FC<ObjectLayerProps> = ({
  objects,
  durationInFrames,
  mood,
  sceneType,
  objectFrames,
  narrationText,
  background,
  characterPlacement,
}) => {
  const frame = useCurrentFrame();

  if (!objects || objects.length === 0) return null;

  const isDark = mood === 'mysterious' || mood === 'tense' || mood === 'dramatic' || mood === 'eerie';
  const isEvidenceShot = sceneType === 'evidence_closeup' || sceneType === 'timeline_card' || sceneType === 'reveal_or_twist';
  const isCaseBoard = sceneType === 'case_board';
  const baseOpacity = isDark ? 0.72 : 0.9;

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {objects.slice(0, 3).map((objName, index) => {
        let pos = getSemanticPlacement(objName, index, narrationText || '', background || '', characterPlacement);
        if (isCaseBoard) {
          pos = CASE_BOARD_POSITIONS[index % CASE_BOARD_POSITIONS.length];
        } else if (isEvidenceShot) {
          pos = EVIDENCE_POSITIONS[index % EVIDENCE_POSITIONS.length];
        }

        // Use audio-synced injection timing if available, otherwise stagger evenly
        const entryFrame = objectFrames?.[index] ?? index * 12;

        // Spring entrance from injection frame
        const localFrame = frame - entryFrame;
        if (localFrame < 0) return null;

        const scale = springIn(localFrame, 30, 0);
        const fadeOut = easeOut(frame, durationInFrames - 20, durationInFrames, 1, 0);
        const finalOpacity = Math.min(scale, fadeOut) * baseOpacity;

        // Organic float animation
        const floatY = Math.sin((frame + index * 40) * 0.05) * 6;
        const wobbleRotate = Math.sin((frame + index * 25) * 0.035) * 2 + pos.rotate;

        if (finalOpacity <= 0) return null;

        const objSrc = staticFile(`assets/objects/${resolveObjectName(objName)}.png`);

        return (
          <div
            key={`obj-${objName}-${index}`}
            style={{
              position: 'absolute',
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              width: pos.size,
              height: pos.size,
              opacity: finalOpacity,
              transform: `translate(-50%, -50%) translateY(${floatY}px) scale(${scale}) rotate(${wobbleRotate}deg)`,
              filter: isEvidenceShot
                ? 'drop-shadow(0 18px 34px rgba(0,0,0,0.58))'
                : 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))',
            }}
          >
            <SafeObjectImg
              src={objSrc}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
            />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
