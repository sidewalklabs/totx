import * as React from 'react';
import Slider from 'react-slick';

import * as actions from './action';

export interface Props {
  mode: actions.Mode;
  travelMode: string;
  travelMode2: string;
  onClear: () => any;
  onChange: (newMode: string, isSecondary: boolean) => any;
}

const MODES: {[mode: string]: {icons: string[]; label: string}} = {
  WALK: {
    icons: ['walk'],
    label: 'Walk Only',
  },
  TRANSIT: {
    icons: ['transit'],
    label: 'Transit',
  },
  BICYCLE_RENT: {
    icons: ['bikeshare'],
    label: 'Bikeshare',
  },
  BICYCLE: {
    icons: ['bike'],
    label: 'Bike',
  },
  'BICYCLE_RENT+TRANSIT': {
    icons: ['transit', 'bikeshare'],
    label: 'Transit + Bikeshare',
  },
  WHEELCHAIR: {
    icons: ['wc'],
    label: 'Wheelchair',
  },
};

interface TileProps {
  mode: string;
  selectedMode: string;
  isSecondary?: boolean;
  onChange: (mode: string, isSecondary: boolean) => any;
}

function ModeTile(props: TileProps): JSX.Element {
  const mode = MODES[props.mode];
  const color = props.mode !== props.selectedMode ? 'grey' : props.isSecondary ? 'green' : 'blue';
  return (
    <div className="mode" onClick={() => props.onChange(props.mode, props.isSecondary)}>
      <div>
        <div className="spacer" />
        {mode.icons.map((icon, i) => <div key={i} className={`mode-icon mode-${icon}_${color}`} />)}
      </div>
      <div className={`label ${color}`}>{mode.label}</div>
    </div>
  );
}

interface SingleProps {
  className: string;
  selectedMode: string;
  isSecondary?: boolean;
  onChange: (mode: string, isSecondary: boolean) => any;
}

function TravelModeCarousel(props: SingleProps): JSX.Element {
  return (
    <Slider
      className={props.className}
      dots={false}
      swipeToSlide={true}
      variableWidth={true}
      infinite={false}>
      <ModeTile mode="WALK" {...props} />
      <ModeTile mode="TRANSIT" {...props} />
      <ModeTile mode="BICYCLE_RENT" {...props} />
      <ModeTile mode="BICYCLE" {...props} />
      <ModeTile mode="BICYCLE_RENT+TRANSIT" {...props} />
      <ModeTile mode="WHEELCHAIR" {...props} />
    </Slider>
  );
}

export default class TravelModeSelector extends React.Component<Props, {}> {
  render() {
    const {mode, travelMode, travelMode2, onClear, onChange} = this.props;

    return (
      <>
        <TravelModeCarousel className="mode-choice" onChange={onChange} selectedMode={travelMode} />
        {mode === 'compare-settings' ? (
          <>
            <div className="compare-mode-close-wrapper">
              <div className="compare-mode-close" onClick={onClear} />
            </div>
            <TravelModeCarousel
              className="mode-choice mode-choice2"
              onChange={onChange}
              selectedMode={travelMode2}
              isSecondary={true}
            />
          </>
        ) : null}
      </>
    );
  }
}
