import * as React from 'react';

import {TransitModes} from '../common/r5-types';
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
    const distance = Math.round(route.distanceKm * 100) / 100;
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
          <span className="route-length-distance">{distance} km</span>
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

function describeStep(step: SummaryStep): string {
  if (isTransitStep(step)) {
    return `${formatTime(step.startTimeSecs)} Take ${step.mode} ${step.shortName}`;
  } else {
    const distanceKm = (step.distance / 1e6).toFixed(1);
    const minutes = Math.round(step.duration / 60);
    return `${step.mode} ${distanceKm} km (${minutes} min)`;
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
