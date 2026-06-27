import { Composition } from 'remotion';
import { Story } from './Story';
import type { StoryProps } from './lib/types';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition<null, StoryProps & Record<string, unknown>>
        id="Story"
        component={Story}
        durationInFrames={300} // overridden by input props
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          scenes: [],
          fps: 30,
          totalFrames: 300,
        }}
        calculateMetadata={({ props }) => {
          return {
            durationInFrames: props.totalFrames || 300,
            fps: props.fps || 30,
          };
        }}
      />
    </>
  );
};
