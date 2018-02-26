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
exports.__esModule = true;
var React = require("react");
var _ = require("underscore");
var datastore_1 = require("./datastore");
var glyphs_1 = require("./glyphs");
var nyc_routes_1 = require("./nyc-routes");
/**
 * A component for displaying a route in a compact form, e.g. "walk -> L -> 4 -> walk".
 */
var RouteDisplay = /** @class */ (function (_super) {
    __extends(RouteDisplay, _super);
    function RouteDisplay(props) {
        var _this = _super.call(this, props) || this;
        _this.state = { showExpanded: false };
        _this.toggleVerboseDisplay = _this.toggleVerboseDisplay.bind(_this);
        return _this;
    }
    RouteDisplay.prototype.render = function () {
        var _a = this.props, className = _a.className, route = _a.route;
        if (!route) {
            return <span className={className}>Not accessible with current settings</span>;
        }
        var steps = route.steps
            .filter(function (step) { return step.mode === 1 || step.distanceKm > 0.1; })
            .map(function (step, i) {
            return step.mode === 1
                ? <RouteSymbol key={'r' + i} id={step.routeId}/>
                : <span key={'r' + i} className={'walk'}/>;
        });
        var arrowSteps = [];
        steps.forEach(function (step, i) {
            if (i)
                arrowSteps.push(<span key={'a' + i} className="transit-connector"/>);
            arrowSteps.push(step);
        });
        var minutes = Math.floor(route.travelTimeSecs / 60);
        return (<span className={className} onClick={this.toggleVerboseDisplay}>
        <span className="commute-time">{minutes}min</span>
        {arrowSteps}
        {this.state.showExpanded
            ? <div className="route-details">
              <span className="close-button" onClick={this.toggleVerboseDisplay}>
                {glyphs_1["default"].close}
              </span>
              <RouteDetails route={route}/>
            </div>
            : null}
      </span>);
    };
    RouteDisplay.prototype.toggleVerboseDisplay = function () {
        this.setState({ showExpanded: !this.state.showExpanded });
    };
    RouteDisplay.prototype.componentWillUpdate = function (newProps, newState) {
        if (newProps.route !== this.props.route) {
            this.setState({ showExpanded: false });
        }
    };
    return RouteDisplay;
}(React.Component));
exports["default"] = RouteDisplay;
var NYC_ROUTES = _.indexBy(nyc_routes_1["default"], 'route_id');
// Component for the name of a subway/bus route, e.g. "L", "4" or "B52".
// If we know enough about the route to render a nice symbol for it, we do.
// Otherwise we fall back to plain text.
function RouteSymbol(props) {
    var route = NYC_ROUTES[props.id];
    if (!route) {
        // Might be a bus route.
        return <span className="route-name">{props.id}</span>;
    }
    var style = {
        backgroundColor: '#' + (route.route_color || '444')
    };
    var alt = route.route_long_name + '\n' + route.route_desc;
    return <span className="route-symbol" title={alt} style={style}>{props.id}</span>;
}
function zeropad(num) {
    return (num < 10 ? '0' : '') + num;
}
function formatTime(secs) {
    var hours = Math.floor(secs / 3600);
    secs %= 3600;
    var minutes = Math.floor(secs / 60);
    secs %= 60;
    var strMins = zeropad(minutes);
    return hours + ":" + strMins;
}
function describeStep(step) {
    var from = step.from.stopName;
    var to = step.to.stopName;
    if (step.mode === datastore_1.TransportMode.Transit) {
        return "Take " + step.routeId + " " + step.numStops + " stops from " + from + " to " + to + ".";
    }
    else if (step.mode === datastore_1.TransportMode.Walk) {
        var distance = void 0;
        if (step.distanceKm >= 0.16) {
            // 0.1 mile
            distance = (step.distanceKm * 0.6214).toFixed(1) + ' mi.';
        }
        else {
            distance = Math.round(step.distanceKm * 3280.84) + ' ft.';
        }
        return "Walk " + distance + " from " + from + " to " + to + ".";
    }
}
function RouteDetails(props) {
    var steps = props.route.steps;
    var lis = steps.map(function (step, i) {
        return <li key={i}>{formatTime(step.departTimeSecs)} {describeStep(step)}</li>;
    });
    return (<ol>
      {lis}
      <li>{formatTime(props.route.arriveTimeSecs)} Arrive at destination.</li>
    </ol>);
}
