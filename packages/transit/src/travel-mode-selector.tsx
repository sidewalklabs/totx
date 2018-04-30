import * as React from 'react';

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
  onClick: (mode: string, isSecondary: boolean) => any;
}

function ModeTile(props: TileProps): JSX.Element {
  const mode = MODES[props.mode];
  const color = props.mode !== props.selectedMode ? 'grey' : props.isSecondary ? 'green' : 'blue';
  return (
    <div className="mode" onClick={() => props.onClick(props.mode, props.isSecondary)}>
      <div>
        {mode.icons.map((icon, i) => <div key={i} className={`mode-icon mode-${icon}_${color}`} />)}
      </div>
      <div className={`label ${color}`}>{mode.label}</div>
    </div>
  );
}

export default class TravelModeSelector extends React.Component<Props, {}> {
  render() {
    const {mode, travelMode, travelMode2, onClear, onChange} = this.props;
    const tileProps1 = {onClick: onChange, selectedMode: travelMode};
    const tileProps2 = {onClick: onChange, selectedMode: travelMode2, isSecondary: true};
    return (
      <>
        <div className="mode-choice">
          <div className="row">
            <div className="prev-arrow" />
            <ModeTile mode="WALK" {...tileProps1} />
            <ModeTile mode="TRANSIT" {...tileProps1} />
            <ModeTile mode="BICYCLE_RENT" {...tileProps1} />
            <div className="next-arrow" />
            <ModeTile mode="BICYCLE" {...tileProps1} />
            <ModeTile mode="BICYCLE_RENT+TRANSIT" {...tileProps1} />
            <ModeTile mode="WHEELCHAIR" {...tileProps1} />
          </div>
        </div>
        {mode === 'compare-settings' ? (
          <div className="mode-choice mode-choice2">
            <div className="compare-mode-close" onClick={onClear} />
            <div className="row">
              <ModeTile mode="WALK" {...tileProps2} />
              <ModeTile mode="TRANSIT" {...tileProps2} />
              <ModeTile mode="BICYCLE_RENT" {...tileProps2} />
              <ModeTile mode="BICYCLE" {...tileProps2} />
              <ModeTile mode="BICYCLE_RENT+TRANSIT" {...tileProps2} />
              <ModeTile mode="WHEELCHAIR" {...tileProps2} />
            </div>
          </div>
        ) : null}
      </>
    );
  }
}
