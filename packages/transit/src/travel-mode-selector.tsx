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

// <TravelMode value={travelMode} onChange={newMode => onChange(newMode, false)} />

export default class TravelModeSelector extends React.Component<Props, {}> {
  render() {
    const {mode, travelMode, travelMode2, onClear, onChange} = this.props;
    return (
      <div className="mode-choice">
        <div className="row">
          <div className="mode">
            <div>
              <div className="mode-icon mode-bike_blue" />
            </div>
            <div className="label">Bike</div>
          </div>
          <div className="mode">
            <div>
              <div className="mode-icon mode-transit_blue" />
              <div className="mode-icon mode-bikeshare_blue" />
            </div>
            <div className="label">Transit + Bikeshare</div>
          </div>
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
