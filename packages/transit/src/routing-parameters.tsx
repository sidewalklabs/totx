import * as classNames from 'classnames';
import * as React from 'react';

import Action from './action';
import {DEFAULT_OPTIONS, QueryOptions, State} from './datastore';
import glyphs from './glyphs';
import * as controls from './parameter-selectors';
import RouteDisplay from './route-display';

interface Props extends State {
  onChange(which: number, newOptions: Partial<QueryOptions>): any;
  handleAction(action: Action): any;
}

const modePrefValue = (options: QueryOptions) =>
  options.rail_multiplier + ',' + options.bus_multiplier;

export default class RoutingParameters extends React.Component<Props, {}> {
  constructor(props: Props) {
    super(props);
    this.setModePref = this.setModePref.bind(this);
  }

  render() {
    const props = this.props;

    const options = {...DEFAULT_OPTIONS, ...props.options};
    const options2 = {...DEFAULT_OPTIONS, ...props.options2};

    const set = (field: keyof QueryOptions, transform: (v: string) => any = x => x) => (
      which: number,
      value: string,
    ) => this.props.onChange(which, {[field]: transform(value)});

    const obj = {mode: props.mode, options, options2};

    return (
      <div className={classNames('routing-settings', props.mode)}>
        <SettingsRow
          {...obj}
          field="departure_time"
          component={controls.TimeChooser}
          label="Departure time"
          onSetValue={set('departure_time')}
        />

        <SettingsRow
          {...obj}
          field="max_walking_distance_km"
          component={controls.MaxWalkingDistance}
          label="Max. walking distance"
          onSetValue={set('max_walking_distance_km', Number)}
        />

        <SettingsRow
          {...obj}
          field="max_number_of_transfers"
          component={controls.MaxTransfers}
          label="Transfers"
          onSetValue={set('max_number_of_transfers', Number)}
        />

        <SettingsRow
          {...obj}
          toValue={modePrefValue}
          component={controls.ModePreference}
          label="Mode preference"
          onSetValue={this.setModePref}
        />

        <SettingsRow
          {...obj}
          field="travel_mode"
          component={controls.TravelMode}
          label="Travel mode"
          onSetValue={set('travel_mode', String)}
        />

        <SettingsRow
          {...obj}
          field="require_wheelchair"
          component={controls.WheelchairChooser}
          label="Wheelchair accessible"
          onSetValue={set('require_wheelchair', x => x === 'true')}
        />
      </div>
    );
  }

  setModePref(which: number, value: string) {
    const [rail, bus] = value.split(',').map(Number);
    this.props.onChange(which, {
      bus_multiplier: bus,
      rail_multiplier: rail,
    });
  }
}

interface SettingRowProps {
  label: string; // e.g. "Mode preference"
  component: React.StatelessComponent<controls.SelectProps>; // for displaying/selecting values.

  // One of field or toValue must be set.
  field?: keyof QueryOptions;
  toValue?: (options: QueryOptions) => string;
  onSetValue: (which: number, newValue: string) => any;

  // Current UI state.
  mode: State['mode'];
  options: QueryOptions;
  options2: QueryOptions;
}

// A single row of the settings panel.
// It has a label, a primary value and (possibly) a secondary value.
// The values are both editable.
const SettingsRow: React.StatelessComponent<SettingRowProps> = props => {
  const getValue = (options: QueryOptions) =>
    props.field ? '' + options[props.field] : props.toValue(options);

  const value = getValue(props.options);
  const primary = React.createElement<controls.SelectProps>(props.component, {
    value,
    onChange: v => props.onSetValue(1, v),
  });
  let secondary: React.ReactElement<controls.SelectProps> = null;
  if (props.mode === 'compare-settings') {
    const value2 = getValue(props.options2);
    secondary = React.createElement<controls.SelectProps>(props.component, {
      value: value2,
      onChange: v => props.onSetValue(2, v),
      isSecondary: true,
      isMismatch: value !== value2,
    });
  }

  return (
    <div className="row">
      <span className="label">{props.label}</span>
      {primary}
      {secondary}
    </div>
  );
};
