import * as React from 'react';

import * as actions from './action';
import {TravelMode} from './parameter-selectors';

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
}

function ModeTile(props: TileProps): JSX.Element {
  const mode = MODES[props.mode];
  const color = props.mode !== props.selectedMode ? 'grey' : props.isSecondary ? 'green' : 'blue';
  return (
    <div className="mode">
      <div>
        {mode.icons.map((icon, i) => <div key={i} className={`mode-icon mode-${icon}_${color}`} />)}
      </div>
      <div className="label">{mode.label}</div>
    </div>
  );
}

// <TravelMode value={travelMode} onChange={newMode => onChange(newMode, false)} />

export default class TravelModeSelector extends React.Component<Props, {}> {
  render() {
    const {mode, travelMode, travelMode2, onClear, onChange} = this.props;
    return (
      <div className="mode-choice">
        <div className="row">
          <ModeTile mode="WALK" selectedMode={travelMode} />
          <ModeTile mode="TRANSIT" selectedMode={travelMode} />
          <ModeTile mode="BICYCLE_RENT" selectedMode={travelMode} />
          <ModeTile mode="BICYCLE" selectedMode={travelMode} />
          <ModeTile mode="BICYCLE_RENT+TRANSIT" selectedMode={travelMode} />
          <ModeTile mode="WHEELCHAIR" selectedMode={travelMode} />
        </div>
        {mode === 'compare-settings' ? (
          <div className="row">
            <div className="comparison-clear" onClick={onClear}>
              ×
            </div>
            <TravelMode value={travelMode2} onChange={newMode => onChange(newMode, true)} />
          </div>
        ) : null}
      </div>
    );
  }
}
