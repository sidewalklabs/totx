/**
 * Functions to convert from OpenTripPlanner (OTP) routes to SWL router routes.
 */

import * as polyline from 'polyline';

import {Feature} from '../../../utils';
import {Route, Step} from '../route';
import {OTPLeg, OTPPoint, Plan} from './otp-types';

// Convert a leg of an OTP trip to a Step in a Route.
function convertTripLeg(leg: OTPLeg): [Step, Feature] {
  return [
    {
      departTimeSecs: leg.startTime / 1000,
      arriveTimeSecs: leg.endTime / 1000,
      travelTimeSecs: (leg.endTime - leg.startTime) / 1000,
      mode: leg.mode === 'WALK' ? 2 : 1,
      description: leg.mode,
      from: null,
      to: null,
    },
    {
      type: 'Feature',
      properties: {
        steps: leg.steps,
      },
      geometry: {
        type: 'LineString',
        coordinates: polyline.decode(leg.legGeometry.points).map(([lat, lng]) => [lng, lat]),
      },
    },
  ];
}

// Create a GeoJSON Point feature from an OTP point.
function otpPointToFeature(point: OTPPoint): Feature {
  return {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [point.lon, point.lat],
    },
    properties: {
      name: point.name,
      vertexType: point.vertexType,
    },
    id: point.name,
  };
}

// Convert an OTP Plan to a Route that looks like one from the SWL router.
export function planToRoute(plan: Plan): Route {
  const route = plan.itineraries[0];
  const features: Feature[] = [otpPointToFeature(plan.from), otpPointToFeature(plan.to)];
  const steps: Step[] = [];

  for (const leg of route.legs) {
    const [step, feature] = convertTripLeg(leg);
    steps.push(step);
    features.push(feature);
  }

  const origin = plan.from;
  const destination = plan.to;
  return {
    origin: {id: 'origin', latitude: origin.lat, longitude: origin.lat},
    destination: {id: 'destination', latitude: destination.lat, longitude: destination.lon},
    departureSecs: route.startTime / 1000,
    arriveTimeSecs: route.endTime / 1000,
    travelTimeSecs: (route.endTime - route.startTime) / 1000,
    walkingDistanceKm: 0,
    steps: [],
    geojson: {
      type: 'FeatureCollection',
      features,
    },
  };
}
