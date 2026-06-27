import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Camera } from './components/Camera';
import { Background } from './components/Background';
import { Character } from './components/Character';
import { ObjectLayer } from './components/ObjectLayer';
import { TextOverlay } from './components/TextOverlay';
import { ParticleLayer } from './components/ParticleLayer';
import { VolumetricLight } from './components/VolumetricLight';
import { PostProcess } from './components/PostProcess';
import { TransitionLayer } from './components/TransitionLayer';
import { DepthLayer } from './components/DepthLayer';
import { generateAudioSync, isHitFrame } from './lib/audio-sync';
import type { SceneProps } from './lib/types';

// Map mood/objects to particle effects
function getParticleEffect(mood: string, objects: string[], fgTokens?: string[]): { type: 'snow' | 'rain' | 'dust' | 'embers'; intensity: 'light' | 'medium' | 'heavy' } | null {
  if (fgTokens) {
    if (fgTokens.includes('particles_snow')) return { type: 'snow', intensity: 'medium' };
    if (fgTokens.includes('particles_rain')) return { type: 'rain', intensity: 'heavy' };
    if (fgTokens.includes('particles_embers')) return { type: 'embers', intensity: 'light' };
    if (fgTokens.includes('particles_dust')) return { type: 'dust', intensity: 'light' };
  }
  if (objects.includes('snow_particles') || objects.includes('snow')) return { type: 'snow', intensity: 'medium' };
  if (objects.includes('rain')) return { type: 'rain', intensity: 'heavy' };
  if (objects.includes('fire') || objects.includes('embers')) return { type: 'embers', intensity: 'light' };
  if (mood === 'mysterious' || mood === 'eerie') return { type: 'dust', intensity: 'light' };
  if (mood === 'dramatic') return { type: 'dust', intensity: 'medium' };
  return null;
}

export const Scene: React.FC<SceneProps> = ({
  narration_text,
  background,
  character_name,
  character_pose,
  character_expression,
  objects,
  camera,
  transition,
  text_overlay,
  mood,
  scene_type,
  durationInFrames,
  composition,
}) => {
  const frame = useCurrentFrame();

  const particles = getParticleEffect(composition?.mood || mood, objects || [], composition?.environment?.fg_tokens);
  const cameraMovement = composition?.camera?.movement || camera;
  const focalPoint = composition?.camera?.focal_point || { x: 50, y: 45 };
  const cameraIntensity = composition?.camera?.intensity || 'moderate';
  const overlayText: string | null = !text_overlay
    ? null
    : typeof text_overlay === 'object'
      ? text_overlay.text
      : text_overlay;

  // Audio sync — generate beat markers from narration text
  const audioSync = generateAudioSync(narration_text || '', durationInFrames);
  const hitFrame = isHitFrame(frame, audioSync.beats);

  // Hit flash — brief brightness boost on climax beats
  const hitFlash = hitFrame ? 'brightness(1.15)' : undefined;

  return (
    <TransitionLayer transition={transition} durationInFrames={durationInFrames}>
      <Camera
        movement={cameraMovement}
        durationInFrames={durationInFrames}
        mood={composition?.mood || mood}
        focalPoint={focalPoint}
        intensity={cameraIntensity}
      >
        {/* Always use PNG Background — never the procedural EnvironmentLayer */}
        <Background
          name={background}
          narrationText={narration_text}
          objects={objects}
          mood={composition?.mood || mood}
          textOverlay={overlayText}
          durationInFrames={durationInFrames}
        />

        <DepthLayer
          background={background}
          sceneType={scene_type}
          mood={composition?.mood || mood}
          durationInFrames={durationInFrames}
        />

        {(!composition || composition.character?.visible) && (
          <Character
            characterName={(composition?.character?.name || character_name || 'marcus') as any}
            pose={composition?.character?.pose || character_pose}
            expression={composition?.character?.expression || character_expression}
            mood={composition?.mood || mood}
            placement={composition?.character?.placement}
            silhouette={composition?.character?.silhouette}
          />
        )}

        {composition?.lighting && (
          <VolumetricLight
            type={composition.lighting.type || 'ambient'}
            direction={composition.lighting.direction || 'center'}
            color={composition.lighting.color || '#ffffff'}
            intensity={composition.lighting.intensity ?? 0.5}
          />
        )}

        {/* Always render objects */}
        <ObjectLayer
          objects={objects}
          durationInFrames={durationInFrames}
          mood={composition?.mood || mood}
          objectFrames={audioSync.objectFrames}
          sceneType={scene_type}
        />
        {particles && <ParticleLayer type={particles.type} intensity={particles.intensity} durationInFrames={durationInFrames} />}
        {overlayText && <TextOverlay 
            text={overlayText} 
            durationInFrames={durationInFrames} />}
      </Camera>

      {/* Beat-synced hit flash overlay */}
      {hitFlash && (
        <AbsoluteFill style={{ filter: hitFlash, pointerEvents: 'none' }} />
      )}

      <PostProcess mood={composition?.mood || mood} letterbox={!!composition} grain={true} />
    </TransitionLayer>
  );
};
