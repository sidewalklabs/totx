import * as React from 'react';

import glyphs from './glyphs';
import TorontoStories from './stories';

interface ScenariosProps {
  currentStory: string;
  onSetStory: (story: string) => any;
}

const STORY_NAMES = Object.keys(TorontoStories);

export default function Scenarios(props: ScenariosProps): JSX.Element {
  if (!props.currentStory) {
    return null;
    /*
     return (
     <div className="minimized-scenarios" onClick={() => props.onSetStory('intro')}>
     Scenarios
     </div>
     );
     */
  }

  const story = TorontoStories[props.currentStory];
  const index = STORY_NAMES.indexOf(props.currentStory);

  const isFirst = index === 0;
  const isLast = index === STORY_NAMES.length - 1;

  const nextStory = () => props.onSetStory(STORY_NAMES[index + 1]);
  const prevStory = () => props.onSetStory(STORY_NAMES[index - 1]);
  const clearStory = () => props.onSetStory(null);
  const hide = {visibility: 'hidden'};

  return (
    <div className="scenarios">
      <div className="prev-scenario" onClick={prevStory} style={isFirst ? hide : {}}>
        {glyphs.left}
      </div>
      <div className="scenario-text">
        <div className="header">
          {story.header}
          <span className="close-button" onClick={clearStory}>
            {glyphs.close}
          </span>
        </div>
        <div className="subheader">{story.subHeader}</div>
      </div>
      <div className="next-scenario" onClick={nextStory} style={isLast ? hide : {}}>
        {glyphs.right}
      </div>
    </div>
  );
}
