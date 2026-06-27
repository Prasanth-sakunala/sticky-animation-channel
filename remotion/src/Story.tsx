import { AbsoluteFill, Sequence } from 'remotion';
import { Scene } from './Scene';
import type { StoryProps } from './lib/types';

export const Story: React.FC<StoryProps> = ({ scenes }) => {
  let frameOffset = 0;
  if(!scenes || scenes.length === 0) {
    return <AbsoluteFill style={{backgroundColor: '#1a1a2e'}}/>;
  }
  return (
    <AbsoluteFill style={{ backgroundColor: '#1a1a2e' }}>
      {scenes.map((scene) => {
        const startFrame = frameOffset;
        frameOffset += scene.durationInFrames;

        return (
          <Sequence
            key={scene.scene_id}
            from={startFrame}
            durationInFrames={scene.durationInFrames}
          >
            <Scene {...scene} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
