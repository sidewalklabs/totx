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
import {profileResponseToRoute, SECONDS_PER_HOUR} from './route-converter';

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
  // Defaults to all transit modes
  let transitModes = _.values(TransitModes);
  let directModes: LegMode[] = [LegMode.WALK];

  const req: ProfileRequest = {
    fromLat: origin.lat,
    fromLon: origin.lng,
    date: '2017-10-16', // This is a date for which all GTFS feeds in use are valid.
    // When we add multimodal availability like bike-to-transit, access and egress modes will
    // become options as well.
    accessModes: directModes.join(),
    egressModes: directModes.join(),
    transitModes: transitModes.join(),
    directModes: directModes.join(),
    verbose: true,
  };
  if (destination) {
    req.toLat = destination.lat;
    req.toLon = destination.lng;
  }
  if (options) {
    if (options.travel_mode in TransitModes) {
      if (options.travel_mode === TransitModes.TRANSIT) {
        transitModes = transitModes; // Convert TRANSIT to all modes
      } else {
        transitModes = [options.travel_mode as TransitModes];
      }
    } else {
      // Select only direct modes.
      transitModes = [];
      directModes = [options.travel_mode as LegMode];
    }
    req.directModes = directModes.join();
    req.transitModes = transitModes.join();

    if (options.departure_time) {
      const departTime = parseTime(options.departure_time);
      req.fromTime = departTime;
      req.toTime = departTime + 2 * SECONDS_PER_HOUR;
    }
    req.wheelchair = options.require_wheelchair;
  }

  return req;
}

export default R5Router;
