import * as React from 'react';
import * as _ from 'underscore';

import {Route, Step, TransitModes, LegMode} from './datastore';
import glyphs from './glyphs';
import routes from './toronto-routes';

interface RouteDisplayProps {
  route: Route;
  className: string;
}

interface RouteDisplayState {
  showExpanded: boolean;
}

/**
 * A component for displaying a route in a compact form, e.g. "walk -> L -> 4 -> walk".
 */
export default class RouteDisplay extends React.Component<RouteDisplayProps, RouteDisplayState> {
  constructor(props: RouteDisplayProps) {
    super(props);
    this.state = {showExpanded: false};
    this.toggleVerboseDisplay = this.toggleVerboseDisplay.bind(this);
  }

  render() {
    const {className, route} = this.props;
    if (!route) {
      return <span className={className}>Not accessible with current settings</span>;
    }
    const steps = route.steps
      .filter(step => step.mode in TransitModes || step.distanceKm > 0.1)
      .map(
        (step, i) =>
          step.mode in TransitModes ? (
            <RouteSymbol key={'r' + i} id={step.routeId} />
          ) : (
            <span key={'r' + i} className={'walk'} />
          ),
      );
    const arrowSteps = [] as Array<JSX.Element | string>;
    steps.forEach((step, i) => {
      if (i) arrowSteps.push(<span key={'a' + i} className="transit-connector" />);
      arrowSteps.push(step);
    });

    const minutes = Math.floor(route.travelTimeSecs / 60);

    return (
      <span className={className} onClick={this.toggleVerboseDisplay}>
        <span className="commute-time">{minutes}min</span>
        {arrowSteps}
        {this.state.showExpanded ? (
          <div className="route-details">
            <span className="close-button" onClick={this.toggleVerboseDisplay}>
              {glyphs.close}
            </span>
            <RouteDetails route={route} />
          </div>
        ) : null}
      </span>
    );
  }

  toggleVerboseDisplay() {
    this.setState({showExpanded: !this.state.showExpanded});
  }

  componentWillUpdate(newProps: RouteDisplayProps, newState: RouteDisplayState) {
    if (newProps.route !== this.props.route) {
      this.setState({showExpanded: false});
    }
  }
}

const TORONTO_ROUTES = _.indexBy(routes, 'route_id');

// Component for the name of a subway/bus route, e.g. "L", "4" or "B52".
// If we know enough about the route to render a nice symbol for it, we do.
// Otherwise we fall back to plain text.
function RouteSymbol(props: {id: string}) {
  const route = TORONTO_ROUTES[props.id];
  if (!route) {
    // Might be a bus route.
    return <span className="route-name">{props.id}</span>;
  }

  const style: React.CSSProperties = {
    backgroundColor: '#' + (route.route_color || '444'),
  };
  const alt = route.route_long_name + '\n' + route.route_desc;

  return (
    <span className="route-symbol" title={alt} style={style}>
      {route.route_short_name}
    </span>
  );
}

function zeropad(num: number) {
  return (num < 10 ? '0' : '') + num;
}

function formatTime(secs: number) {
  const hours = Math.floor(secs / 3600);
  secs %= 3600;
  const minutes = Math.floor(secs / 60);
  secs %= 60;

  const strMins = zeropad(minutes);
  return `${hours}:${strMins}`;
}

function describeStep(step: Step): string {
  const from = step.from.stopName;
  const to = step.to.stopName;

  if (step.mode in TransitModes) {
    return `Take ${TORONTO_ROUTES[step.routeId].route_long_name} ${
      step.numStops
    } stops from ${from} to ${to}.`;
  } else if (step.mode in LegMode) {
    let distance: string;
    if (step.distanceKm >= 0.16) {
      // 0.1 mile
      distance = (step.distanceKm * 0.6214).toFixed(1) + ' mi.';
    } else {
      distance = Math.round(step.distanceKm * 3280.84) + ' ft.';
    }
    return `Walk ${distance} from ${from} to ${to}.`;
  }
}

function RouteDetails(props: {route: Route}): JSX.Element {
  const steps = props.route.steps;
  const lis = steps.map((step, i) => (
    <li key={i}>
      {formatTime(step.departTimeSecs)} {describeStep(step)}
    </li>
  ));
  return (
    <ol>
      {lis}
      <li>{formatTime(props.route.arriveTimeSecs)} Arrive at destination.</li>
    </ol>
  );
}
