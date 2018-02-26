/** Types for Routes; from router/src/online-router.ts */

import {FeatureCollection} from '../../utils';

export enum TransportMode {
  Origin = 0,
  Transit,
  Walk,
}

export interface Stop {
  // TODO: rename fields to id, latitude, longitude so that this extends Location.
  stopId: string;
  stopName: string;
  stopDesc: string;
  stopLat: number;
  stopLng: number;
  parentStation?: string;
  feed?: string; // for merged feeds, this tracks the original source.
}

interface Location {
  id: string;
  latitude: number;
  longitude: number;
}

/** A single step in a route. */
export interface Step {
  from: Stop; // either a stop or one of the user-specified locations
  to: Stop; // either a stop or one of the user-specified locations
  mode: TransportMode;
  departTimeSecs: number;
  arriveTimeSecs: number;
  travelTimeSecs: number;
  numStops?: number; // for transit
  tripId?: string; // for transit
  routeId?: string; // for transit
  distanceKm?: number; // e.g. for walking
  description: string;
}

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
}
