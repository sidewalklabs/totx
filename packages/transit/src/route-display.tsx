import * as React from 'react';

import {LegMode, TransitModes} from '../common/r5-types';
import {SummaryStep, TransitSummaryStep} from '../server/route';
import {Route} from './datastore';

interface RouteDisplayProps {
  route: Route;
  className: string;
  isComparison: boolean;
  onClearDestination?: () => any;
}

function isTransitStep(step: SummaryStep): step is TransitSummaryStep {
  return step.mode in TransitModes;
}

/**
 * A component for displaying a route in a compact form, e.g. "walk -> L -> 4 -> walk".
 */
export default class RouteDisplay extends React.Component<RouteDisplayProps, {}> {
  constructor(props: RouteDisplayProps) {
    super(props);
    this.state = {showExpanded: false};
    this.handleClear = this.handleClear.bind(this);
  }

  render() {
    const {className, isComparison, route, onClearDestination} = this.props;
    if (!route) {
      return <span className={className}>Not accessible with current settings</span>;
    }

    const minutes = Math.floor(route.travelTimeSecs / 60);
    const distanceKm = route.distanceKm.toFixed(2);
    return (
      <div className={className}>
        {onClearDestination ? (
          <div className="route-clear" onClick={this.handleClear}>
            ×
          </div>
        ) : null}
        <div className="route-length">
          <span className="route-length-title label">Route Length</span>
          <span className="route-length-time">{minutes} min</span>
          <span className="route-length-distance">{distanceKm} km</span>
        </div>

        {route && !isComparison ? <RouteDetails route={route} /> : null}
      </div>
    );
  }

  handleClear() {
    this.props.onClearDestination();
  }
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

/**
 * Display the transit type in commonly used parlance.
 * @param mode The travel mode to display.
 */
function formatMode(mode: LegMode | TransitModes) {
  switch (mode) {
    case 'TRAM':
      return 'Streetcar';
    case 'SUBWAY':
      return 'Subway';
    case 'RAIL':
      return 'Train';
    case 'BUS':
      return 'Bus';
    case 'FERRY':
      return 'Ferry';
    case 'CABLE_CAR':
      return 'Cable car';
    case 'GONDOLA':
      return 'Gondola';
    case 'FUNICULAR':
      return 'Funicular';
    case 'WALK':
      return 'Walk';
    case 'BICYCLE':
      return 'Cycle';
    case 'BICYCLE_RENT':
      return 'Bikeshare';
    default:
      return '';
  }
}

/**
 * Display the transit line name according to most commonly used name.
 * @param step the full transit step
 */
function formatLineName(step: TransitSummaryStep) {
  switch (step.mode) {
    case 'SUBWAY':
      return step.longName;
    case 'TRAM':
    case 'BUS':
      return step.shortName + ' - ' + step.longName;
    default:
      return step.shortName;
  }
}

function describeStep(step: SummaryStep): string {
  if (isTransitStep(step)) {
    return `${formatTime(step.startTimeSecs)} Take ${formatMode(step.mode)} ${formatLineName(
      step,
    )}`;
  } else {
    const distanceKm = (step.distance / 1e6).toFixed(1);
    const minutes = Math.round(step.duration / 60);
    return `${formatMode(step.mode)} ${distanceKm} km (${minutes} min)`;
  }
}

function RouteDetails(props: {route: Route}): JSX.Element {
  const steps = props.route.summary;
  const stepElements = steps.map((step, i) => <div key={i}>{describeStep(step)}</div>);
  return (
    <div className="route-details">
      <div>{formatTime(props.route.departureSecs)} Depart origin.</div>
      {stepElements}
      <div>{formatTime(props.route.arriveTimeSecs)} Arrive at destination.</div>
    </div>
  );
}
