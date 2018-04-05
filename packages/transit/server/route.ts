/** Types for Routes */

import {FeatureCollection} from '../../utils';
import {LegMode, TransitModes} from '../common/r5-types';

export interface Stop extends Location {
  stopName?: string;
  stopDesc?: string;
  parentStation?: string;
  feed?: string; // for merged feeds, this tracks the original source.
}

export interface Location {
  id: string;
  latitude: number;
  longitude: number;
}

/** A single step in a route. */
export interface Step {
  from: Stop; // either a stop or one of the user-specified locations
  to: Stop; // either a stop or one of the user-specified locations
  mode: LegMode | TransitModes;
  departTimeSecs: number;
  arriveTimeSecs: number;
  travelTimeSecs: number;
  numStops?: number; // for transit
  tripId?: string; // for transit
  routeId?: string; // for transit
  distanceKm?: number; // e.g. for walking
  description: string;
}

export interface LegSummaryStep {
  mode: LegMode;
  duration: number; // in seconds
  distance: number; // in millimeters
}

export interface TransitSummaryStep {
  mode: TransitModes;
  agencyName: string;
  shortName: string;
}

export type SummaryStep = LegSummaryStep | TransitSummaryStep;

/** A complete route from one location to another. */
export interface Route {
  origin: Location;
  destination: Location;
  departureSecs: number;
  arriveTimeSecs: number;
  travelTimeSecs: number;
  walkingDistanceKm: number;
  steps: Step[];
  geojson: FeatureCollection;
  summary: SummaryStep[];
}
