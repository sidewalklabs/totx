"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
exports.__esModule = true;
var classNames = require("classnames");
var React = require("react");
var _ = require("underscore");
var datastore_1 = require("./datastore");
var glyphs_1 = require("./glyphs");
var controls = require("./parameter-selectors");
var route_display_1 = require("./route-display");
var modePrefValue = function (options) {
    return options.rail_multiplier + ',' + options.bus_multiplier;
};
var MANHATTAN_L_STOPS = [
    'L06',
    'L05',
    'L03',
    'L02',
    'L01',
];
var SECOND_AVE_STOPS = [
    'Q03',
    'Q04',
    'Q05',
];
var routesChoiceValue = function (options) {
    return _.isEmpty(options.exclude_stops)
        ? 'all'
        : _.isEqual(options.exclude_stops, MANHATTAN_L_STOPS)
            ? 'no-l'
            : _.isEqual(options.exclude_stops, SECOND_AVE_STOPS) ? 'no-2nd' : 'other';
};
var RoutingParameters = /** @class */ (function (_super) {
    __extends(RoutingParameters, _super);
    function RoutingParameters(props) {
        var _this = _super.call(this, props) || this;
        _this.setModePref = _this.setModePref.bind(_this);
        _this.setRoutes = _this.setRoutes.bind(_this);
        return _this;
    }
    RoutingParameters.prototype.render = function () {
        var _this = this;
        var props = this.props;
        var options = __assign({}, datastore_1.DEFAULT_OPTIONS, props.options);
        var options2 = __assign({}, datastore_1.DEFAULT_OPTIONS, props.options2);
        var set = function (field, transform) {
            if (transform === void 0) { transform = function (x) { return x; }; }
            return function (which, value) {
                return _this.props.onChange(which, (_a = {}, _a[field] = transform(value), _a));
                var _a;
            };
        };
        var clearDestination = function () { return _this.props.handleAction({ type: 'clear-destination' }); };
        var backToSingle = function () { return _this.props.handleAction({ type: 'set-mode', mode: 'single' }); };
        var isComparison = props.mode !== 'single';
        var obj = { mode: props.mode, options: options, options2: options2 };
        var routeBit = props.routes.length === 0
            ? []
            : [
                <div key="route-header" className="row">
            <route_display_1["default"] className="route" route={props.routes[0]}/>
            {props.routes.length > 1
                    ? <route_display_1["default"] className="route secondary" route={props.routes[1]}/>
                    : null}
          </div>,
                <div key="route-destination" className="row target-address">
            <span className="address">
              <img src="pin-gray-blank-24x34.png" width="18" height="26"/>
              <span className="close-button" onClick={clearDestination}>{glyphs_1["default"].close}</span>
              {props.destinationAddress}
            </span>
          </div>,
            ];
        var firstMarker = props.mode === 'compare-origin'
            ? <img src="pin-blue-A-18x26.png" width={18} height={26}/>
            : <img src="pin-blue-blank-18x26.png" width={18} height={26}/>;
        return (<div className={classNames('routing-settings', props.mode)}>
        <div className="header row">
          <span className="primary">
            {firstMarker}
            <div className="origin-address">
              {props.originAddress}
            </div>
          </span>
          {isComparison
            ? <span className="secondary">
                <span className="close-button" onClick={backToSingle}>{glyphs_1["default"].close}</span>
                {props.mode === 'compare-origin'
                ? [
                    <img key="pin" src="pin-orange-B-18x26.png" width={18} height={26}/>,
                    <div key="address" className="origin-address">
                        {props.origin2Address}
                      </div>,
                ]
                : 'Alternate settings'}
              </span>
            : null}
        </div>

        {routeBit}

        <SettingsRow {...obj} field="departure_time" component={controls.TimeChooser} label="Departure time" onSetValue={set('departure_time')}/>

        <SettingsRow {...obj} field="max_walking_distance_km" component={controls.MaxWalkingDistance} label="Max. walking distance" onSetValue={set('max_walking_distance_km', Number)}/>

        <SettingsRow {...obj} field="max_number_of_transfers" component={controls.MaxTransfers} label="Transfers" onSetValue={set('max_number_of_transfers', Number)}/>

        <SettingsRow {...obj} toValue={modePrefValue} component={controls.ModePreference} label="Mode preference" onSetValue={this.setModePref}/>

        <SettingsRow {...obj} toValue={routesChoiceValue} component={controls.RoutesChooser} label="Routes" onSetValue={this.setRoutes}/>

        <SettingsRow {...obj} field="require_wheelchair" component={controls.WheelchairChooser} label="Wheelchair accessible" onSetValue={set('require_wheelchair', function (x) { return x === 'true'; })}/>
      </div>);
    };
    RoutingParameters.prototype.setModePref = function (which, value) {
        var _a = value.split(',').map(Number), rail = _a[0], bus = _a[1];
        this.props.onChange(which, {
            bus_multiplier: bus,
            rail_multiplier: rail
        });
    };
    RoutingParameters.prototype.setRoutes = function (which, value) {
        if (value === 'all') {
            this.props.onChange(which, { exclude_stops: [] });
        }
        else if (value === 'no-l') {
            this.props.onChange(which, { exclude_stops: MANHATTAN_L_STOPS });
        }
        else if (value === 'no-2nd') {
            this.props.onChange(which, { exclude_stops: SECOND_AVE_STOPS });
        }
    };
    return RoutingParameters;
}(React.Component));
exports["default"] = RoutingParameters;
// A single row of the settings panel.
// It has a label, a primary value and (possibly) a secondary value.
// The values are both editable.
var SettingsRow = function (props) {
    var getValue = function (options) {
        return props.field ? '' + options[props.field] : props.toValue(options);
    };
    var value = getValue(props.options);
    var primary = React.createElement(props.component, {
        value: value,
        onChange: function (v) { return props.onSetValue(1, v); }
    });
    var secondary = null;
    if (props.mode === 'compare-settings') {
        var value2 = getValue(props.options2);
        secondary = React.createElement(props.component, {
            value: value2,
            onChange: function (v) { return props.onSetValue(2, v); },
            isSecondary: true,
            isMismatch: value !== value2
        });
    }
    return (<div className="row">
      <span className="label">{props.label}</span>
      {primary}
      {secondary}
    </div>);
};
