import * as _ from 'lodash';

/**
 * Wrapper around the R5 one-to-many and one-to-one routing API.
 */
import {
  AnalysisTask,
  LatLng,
  LegMode,
  ProfileOption,
  ProfileRequest,
  TransitModes,
} from '../../common/r5-types';
import {parseTime, requestPromise} from '../utils';
import {profileOptionToRoute, SECONDS_PER_MINUTE} from './route-converter';

import {QueryOptions} from '../../src/datastore';
import {Route} from '../route';

class R5Router {
  constructor(private routerUrl: string) {}

  /** Get directions from an origin to a destination (one-to-one). */
  public async getRoute(
    origin: LatLng,
    destination: LatLng,
    options?: QueryOptions,
  ): Promise<Route> {
    const req = paramsToProfileRequest(origin, options, destination);
    const url = this.routerUrl + '/route';
    const body = await requestPromise<ProfileOption>({
      url,
      method: 'POST',
      json: true,
      body: req,
    });
    return profileOptionToRoute(origin, destination, body);
  }

  public async getTravelTimes(origin: LatLng, options?: QueryOptions) {
    const req: AnalysisTask = {
      ...paramsToProfileRequest(origin, options),
      type: 'TRAVEL_TIME_SURFACE',
    };

    const url = this.routerUrl + '/travelTimeMap';
    const body = await requestPromise<{[id: string]: number}>({
      url,
      method: 'POST',
      json: true,
      body: req,
    });
    return body;
  }
}

function paramsToProfileRequest(
  origin: LatLng,
  options?: QueryOptions,
  destination?: LatLng,
): ProfileRequest {
  let travelMode = 'DEFAULT';
  if (options && options.travel_mode) {
    travelMode = options.travel_mode;
  }
  const {transitModes, accessModes, egressModes, directModes, wheelchair} = interpretTravelMode(
    travelMode,
  );

  const req: ProfileRequest = {
    fromLat: origin.lat,
    fromLon: origin.lng,
    date: '2018-05-07', // This is a date for which all GTFS feeds in use are valid.
    accessModes: accessModes.join(),
    egressModes: egressModes.join(),
    transitModes: transitModes.join(),
    directModes: directModes.join(),
    verbose: true,
    transferPenaltySecs: 300, // Default to 5 minutes cost per transfer.
    wheelchair,
  };
  // Handle optional parameters.
  if (destination) {
    req.toLat = destination.lat;
    req.toLon = destination.lng;
  }
  if (options) {
    if (options.departure_time) {
      const departTime = parseTime(options.departure_time);
      req.fromTime = departTime;
      req.toTime = departTime + 30 * SECONDS_PER_MINUTE;
    }
    if (options.bike_speed_kph) {
      req.bikeSpeed = options.bike_speed_kph * 1000 / 60 / 60; // convert km/h to m/s
    }
  }

  return req;
}

interface R5ModeData {
  transitModes: string[];
  accessModes: LegMode[];
  egressModes: LegMode[];
  directModes: LegMode[];
  wheelchair: boolean;
}

function interpretTravelMode(mode: string): R5ModeData {
  const legModes = (m: LegMode[]) => ({accessModes: m, egressModes: m, directModes: m});

  switch (mode) {
    case 'BICYCLE_RENT':
      return {
        transitModes: [],
        ...legModes([LegMode.WALK, LegMode.BICYCLE_RENT]),
        wheelchair: false,
      };
    case 'WHEELCHAIR':
      return {
        transitModes: _.values(TransitModes),
        ...legModes([LegMode.WALK]),
        wheelchair: true,
      };
    case 'BICYCLE_RENT+TRANSIT':
      return {
        transitModes: _.values(TransitModes),
        ...legModes([LegMode.WALK, LegMode.BICYCLE_RENT]),
        wheelchair: false,
      };
    case 'BICYCLE':
      return {
        transitModes: [],
        ...legModes([LegMode.BICYCLE]),
        wheelchair: false,
      };
    case 'WALK':
      return {
        transitModes: [],
        ...legModes([LegMode.WALK]),
        wheelchair: false,
      };
    case 'TRANSIT':
    default:
      return {
        transitModes: _.values(TransitModes),
        ...legModes([LegMode.WALK]),
        wheelchair: false,
      };
  }
}

export default R5Router;
