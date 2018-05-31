import * as _ from 'underscore';

import {
  LatLng,
  LegMode,
  ProfileOption,
  StreetEdgeInfo,
  TransitEdgeInfo,
  TransitModes,
  ZonedDateTime,
} from '../../common/r5-types';
import {Route, Step, SummaryStep} from '../route';

import {Feature} from '../../../utils';

export const SECONDS_PER_HOUR = 3600;
export const SECONDS_PER_MINUTE = 60;

/** High-level summary of the route, e.g. Walk -> Bus -> Walk */
interface SummarizedRoute {
  features: Feature[];
  steps: Step[];
  summary: SummaryStep[];
}

export function dateTimeToSeconds(dateTime: ZonedDateTime) {
  return dateTime.hour * SECONDS_PER_HOUR + dateTime.minute * SECONDS_PER_MINUTE + dateTime.second;
}

export function profileOptionToRoute(
  origin: LatLng,
  destination: LatLng,
  option: ProfileOption,
): Route {
  const {features, steps, summary} = summarizeOption(option);

  // Pick shortest itinerary.
  // For direct routes this is necessary because all non-transit routes are stored as separate
  // itineraries within the same option.
  const itinerary = option.itinerary.reduce((a, b) => a.duration <= b.duration ? a : b);
  const departureSecs = dateTimeToSeconds(itinerary.startTime);
  const arriveTimeSecs = dateTimeToSeconds(itinerary.endTime);
  const travelTimeSecs = itinerary.duration;
  const distanceKm = (itinerary.distance + itinerary.transitDistance) / 1000 / 1000; // convert mm to km

  return {
    origin: {
      id: 'origin',
      latitude: origin.lat,
      longitude: origin.lng,
    },
    destination: {
      id: 'destination',
      latitude: destination.lat,
      longitude: destination.lng,
    },
    departureSecs,
    arriveTimeSecs,
    travelTimeSecs,
    distanceKm,
    steps,
    summary,
    geojson: {
      type: 'FeatureCollection',
      features,
    },
  };
}

function summarizeOption(option: ProfileOption): SummarizedRoute {
  const makeLegSummary = (leg: any) => _.pick(leg, 'mode', 'distance', 'duration');
  // Pick shortest access option.
  // For direct routes this is necessary because all non-transit routes are stored as separate
  // itineraries within the same option.
  const shortestAccess = option.access.reduce((a, b) => a.duration <= b.duration ? a : b);
  const {streetEdges} = shortestAccess;
  const features = streetEdges.map(featureFromStreetEdgeInfo);
  const steps = streetEdges.map(stepFromStreetEdgeInfo);

  const summary: SummaryStep[] = [];
  summary.push(makeLegSummary(shortestAccess));

  if (option.transit) {
    for (const s of option.transit) {
      const startTimeSecs = dateTimeToSeconds(s.transitEdges[0].fromDepartureTime[0]);
      for (const e of s.transitEdges) {
        features.push(featureFromTransitEdgeInfo(e, s.mode));
        steps.push(stepFromTransitEdgeInfo(e, s.mode));
      }
      const {shortName, longName, agencyName} = s.routes[0];
      summary.push({mode: s.mode, shortName, longName, agencyName, startTimeSecs});

      const {middle} = s;
      if (middle) {
        summary.push(makeLegSummary(middle));
        for (const m of s.middle.streetEdges) {
          features.push(featureFromStreetEdgeInfo(m));
          steps.push(stepFromStreetEdgeInfo(m));
        }
      }
    }
    const shortestEgress = option.egress.reduce((a, b) => a.duration <= b.duration ? a : b);
    for (const e of shortestEgress.streetEdges) {
      features.push(featureFromStreetEdgeInfo(e));
      steps.push(stepFromStreetEdgeInfo(e));
    }
    summary.push(makeLegSummary(shortestEgress));
  }
  return {features, steps, summary};
}

function featureFromStreetEdgeInfo(e: StreetEdgeInfo): Feature {
  return {
    geometry: e.geometry,
    type: 'Feature',
    properties: {
      mode: e.mode,
      streetName: e.streetName,
      distanceKm: e.distanceMm / 1000 / 1000, // convert mm to km
      edgeId: e.edgeId,
      stroke: modeToLineStyle(e.mode),
    },
  };
}

function featureFromTransitEdgeInfo(e: TransitEdgeInfo, mode: TransitModes): Feature {
  return {
    geometry: e.geometry,
    type: 'Feature',
    properties: {
      mode,
      fromStopID: e.fromStopID,
      toStopID: e.toStopID,
      edgeId: e.id,
      routeId: e.routeID,
      stroke: e.routeColor && e.routeColor.match(/^[a-f0-9]{6}/i) ? '#' + e.routeColor : '#000077',
      tripId: e.routeID, // This needs to be nonzero for routeColor to be shown but the actual value doesn't matter.
    },
  };
}

function stepFromStreetEdgeInfo(e: StreetEdgeInfo): Step {
  const startPoint = e.geometry.coordinates[0];
  const endPoint = e.geometry.coordinates[1];

  return {
    from: {
      id: 'origin',
      latitude: startPoint[1], // geojson is in longitude, latitude order
      longitude: startPoint[0],
    },
    to: {
      id: 'destination',
      latitude: endPoint[1], // geojson is in longitude, latitude order
      longitude: endPoint[0],
    },
    mode: e.mode,
    departTimeSecs: 0, // TODO: we don't know how long it takes to walk down one street segment here.
    arriveTimeSecs: 0, // TODO: we don't know how long it takes to walk down one street segment here.
    travelTimeSecs: 0, // TODO: we don't know how long it takes to walk down one street segment here.
    description: e.absoluteDirection + ' on ' + e.streetName,
    distanceKm: e.distanceMm / 1000 / 1000, // convert mm to km
  };
}

function stepFromTransitEdgeInfo(e: TransitEdgeInfo, mode: TransitModes): Step {
  const startPoint = e.geometry.coordinates[0];
  const endPoint = e.geometry.coordinates[1];
  return {
    from: {
      id: 'origin',
      latitude: startPoint[1], // geojson is in longitude, latitude order
      longitude: startPoint[0],
    },
    to: {
      id: 'destination',
      latitude: endPoint[1], // geojson is in longitude, latitude order
      longitude: endPoint[0],
    },
    mode,
    departTimeSecs: 0, // TODO convert from LocalDateTime[] to seconds
    arriveTimeSecs: 0, // TODO convert from LocalDateTime[] to seconds
    travelTimeSecs: 0, // TODO convert diff between departTimeSecs and arriveTimeSecs
    description: '',
    routeId: e.routeID,
  };
}

function modeToLineStyle(mode: LegMode): string {
  switch (mode) {
    case LegMode.BICYCLE:
      return '#0000ff';
    case LegMode.BICYCLE_RENT:
      return '#800080';
    case LegMode.CAR:
      return '#ff0000';
    case LegMode.WALK:
    default:
      return '#00ff00';
  }
}
