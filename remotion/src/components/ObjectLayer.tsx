import React, { useState } from 'react';
import { AbsoluteFill, useCurrentFrame, staticFile } from 'remotion';
import { springIn, easeOut } from '../lib/animations';

interface ObjectLayerProps {
  objects: string[];
  durationInFrames: number;
  mood?: string;
  sceneType?: string;
  /** Audio-synced frames when objects should appear (from audio-sync) */
  objectFrames?: number[];
}

// Positions for object placement (percentages) — avoid center where character sits
const OBJECT_POSITIONS = [
  { x: 8, y: 65, rotate: -5 },
  { x: 85, y: 60, rotate: 4 },
  { x: 6, y: 35, rotate: -3 },
  { x: 88, y: 32, rotate: 6 },
  { x: 12, y: 78, rotate: -7 },
];

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
      onError={() => setFailed(true)}
    />
  );
};

export const ObjectLayer: React.FC<ObjectLayerProps> = ({ objects, durationInFrames, mood, sceneType, objectFrames }) => {
  const frame = useCurrentFrame();

  if (!objects || objects.length === 0) return null;

  const isDark = mood === 'mysterious' || mood === 'tense' || mood === 'dramatic' || mood === 'eerie';
  const isEvidenceShot = sceneType === 'evidence_closeup' || sceneType === 'timeline_card' || sceneType === 'reveal_or_twist';
  const isCaseBoard = sceneType === 'case_board';
  const baseOpacity = isDark ? 0.72 : 0.9;

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {objects.slice(0, 3).map((objName, index) => {
        const pos = isCaseBoard
          ? CASE_BOARD_POSITIONS[index % CASE_BOARD_POSITIONS.length]
          : isEvidenceShot
            ? EVIDENCE_POSITIONS[index % EVIDENCE_POSITIONS.length]
            : { ...OBJECT_POSITIONS[index % OBJECT_POSITIONS.length], size: 90 };

        // Use audio-synced injection timing if available, otherwise stagger evenly
        const entryFrame = objectFrames && objectFrames[index] !== undefined
          ? objectFrames[index]
          : index * 12;

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
