import * as classNames from 'classnames';
import * as React from 'react';

import Action from './action';
import {DEFAULT_OPTIONS, QueryOptions, State} from './datastore';
import * as controls from './parameter-selectors';

interface Props extends State {
  onChange(which: number, newOptions: Partial<QueryOptions>): any;
  handleAction(action: Action): any;
}

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
          field="bike_speed_kph"
          component={controls.BikeSpeed}
          label="Bike speed"
          onSetValue={set('bike_speed_kph', Number)}
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

  return (
    <div className="row">
      <span className="label">{props.label}</span>
      {primary}
    </div>
  );
};
