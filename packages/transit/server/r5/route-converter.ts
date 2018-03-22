import {Route, Step} from '../route';
import {
  LatLng,
  ProfileOption,
  StreetEdgeInfo,
  TransitEdgeInfo,
  TransitModes,
} from '../../common/r5-types';

import {Feature} from '../../../utils';

export const SECONDS_PER_HOUR = 3600;

export function profileOptionToRoute(
  origin: LatLng,
  destination: LatLng,
  option: ProfileOption,
): Route {
  const {features, steps} = optionToFeaturesAndSteps(option);

  const itinerary = option.itinerary[0];
  const departureSecs = itinerary.startTime.hour * SECONDS_PER_HOUR;
  const arriveTimeSecs = itinerary.endTime.hour * SECONDS_PER_HOUR;
  const travelTimeSecs = itinerary.duration;

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
    walkingDistanceKm: 0, // fill this in
    steps,
    geojson: {
      type: 'FeatureCollection',
      features,
    },
  };
}

function optionToFeaturesAndSteps(option: ProfileOption): {features: Feature[]; steps: Step[]} {
  const {streetEdges} = option.access[0];
  const features = streetEdges.map(featureFromStreetEdgeInfo);
  const steps = streetEdges.map(stepFromStreetEdgeInfo);

  if (option.transit) {
    for (const s of option.transit) {
      for (const e of s.transitEdges) {
        features.push(featureFromTransitEdgeInfo(e, s.mode));
        steps.push(stepFromTransitEdgeInfo(e, s.mode));
      }
    }
    for (const e of option.egress[0].streetEdges) {
      features.push(featureFromStreetEdgeInfo(e));
      steps.push(stepFromStreetEdgeInfo(e));
    }
  }
  return {features, steps};
}

function featureFromStreetEdgeInfo(e: StreetEdgeInfo): Feature {
  return {
    geometry: e.geometry,
    type: 'Feature',
    properties: {
      mode: e.mode,
      streetName: e.streetName,
      distance_m: e.distance,
      edgeId: e.edgeId,
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
      stroke: '#' + e.routeColor,
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
    distanceKm: e.distance / 1000 / 1000, // convert mm to km
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
    distanceKm: 0, // TODO add this info
    description: '',
    routeId: e.routeID,
  };
}
