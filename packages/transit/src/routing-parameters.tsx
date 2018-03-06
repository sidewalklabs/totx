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
    const clearDestination = () => this.props.handleAction({type: 'clear-destination'});
    const backToSingle = () => this.props.handleAction({type: 'set-mode', mode: 'single'});

    const isComparison = props.mode !== 'single';

    const obj = {mode: props.mode, options, options2};

    const routeBit =
      props.routes.length === 0
        ? []
        : [
            <div key="route-header" className="row">
              <RouteDisplay className="route" route={props.routes[0]} />
              {props.routes.length > 1 ? (
                <RouteDisplay className="route secondary" route={props.routes[1]} />
              ) : null}
            </div>,
            <div key="route-destination" className="row target-address">
              <span className="address">
                <img src="pin-gray-blank-24x34.png" width="18" height="26" />
                <span className="close-button" onClick={clearDestination}>
                  {glyphs.close}
                </span>
                {props.destinationAddress}
              </span>
            </div>,
          ];

    const firstMarker =
      props.mode === 'compare-origin' ? (
        <img src="pin-blue-A-18x26.png" width={18} height={26} />
      ) : (
        <img src="pin-blue-blank-18x26.png" width={18} height={26} />
      );

    return (
      <div className={classNames('routing-settings', props.mode)}>
        <div className="header row">
          <span className="primary">
            {firstMarker}
            <div className="origin-address">{props.originAddress}</div>
          </span>
          {isComparison ? (
            <span className="secondary">
              <span className="close-button" onClick={backToSingle}>
                {glyphs.close}
              </span>
              {props.mode === 'compare-origin'
                ? [
                    <img key="pin" src="pin-orange-B-18x26.png" width={18} height={26} />,
                    <div key="address" className="origin-address">
                      {props.origin2Address}
                    </div>,
                  ]
                : 'Alternate settings'}
            </span>
          ) : null}
        </div>

        {routeBit}

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
