import * as _ from 'lodash';

/**
 * Wrapper around the R5 one-to-many and one-to-one routing API.
 */
import {parseTime, requestPromise} from '../utils';
import {
  AnalysisTask,
  LatLng,
  LegMode,
  ProfileRequest,
  ProfileOption,
  TransitModes,
} from '../../common/r5-types';
import {profileOptionToRoute, SECONDS_PER_HOUR} from './route-converter';

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
    date: '2017-10-16', // This is a date for which all GTFS feeds in use are valid.
    // When we add multimodal availability like bike-to-transit, access and egress modes will
    // become options as well.
    accessModes: accessModes.join(),
    egressModes: egressModes.join(),
    transitModes: transitModes.join(),
    directModes: directModes.join(),
    verbose: true,
  };
  if (destination) {
    req.toLat = destination.lat;
    req.toLon = destination.lng;
  }
  if (options) {
    if (options.departure_time) {
      const departTime = parseTime(options.departure_time);
      req.fromTime = departTime;
      req.toTime = departTime + 2 * SECONDS_PER_HOUR;
    }
    req.wheelchair = wheelchair;
  }

  return req;
}

function interpretTravelMode(
  mode: string,
): {
  transitModes: string[];
  accessModes: LegMode[];
  egressModes: LegMode[];
  directModes: LegMode[];
  wheelchair: boolean;
} {
  switch (mode) {
    case 'BICYCLE_RENT':
      return {
        transitModes: [],
        accessModes: [LegMode.BICYCLE_RENT],
        egressModes: [LegMode.BICYCLE_RENT],
        directModes: [LegMode.BICYCLE_RENT],
        wheelchair: false,
      };
    case 'WHEELCHAIR':
      return {
        transitModes: _.values(TransitModes),
        accessModes: [LegMode.WALK],
        egressModes: [LegMode.WALK],
        directModes: [LegMode.WALK],
        wheelchair: true,
      };
    case 'BICYCLE_RENT+TRANSIT':
      return {
        transitModes: _.values(TransitModes),
        accessModes: [LegMode.BICYCLE_RENT],
        egressModes: [LegMode.WALK], // TODO: change this when it becomes possible to bikeshare egress from transit (on r5 side)
        directModes: [LegMode.BICYCLE_RENT],
        wheelchair: false,
      };
    case 'BICYCLE':
      return {
        transitModes: [],
        accessModes: [LegMode.BICYCLE],
        egressModes: [LegMode.BICYCLE],
        directModes: [LegMode.BICYCLE],
        wheelchair: false,
      };
    case 'WALK':
      return {
        transitModes: [],
        accessModes: [LegMode.WALK],
        egressModes: [LegMode.WALK],
        directModes: [LegMode.WALK],
        wheelchair: false,
      };
    case 'TRANSIT':
    default:
      return {
        transitModes: _.values(TransitModes),
        accessModes: [LegMode.WALK],
        egressModes: [LegMode.WALK],
        directModes: [LegMode.WALK],
        wheelchair: false,
      };
  }
}

export default R5Router;
