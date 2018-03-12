/**
 * Wrapper around the R5 one-to-many and one-to-one routing API.
 */
import * as request from 'request';
import {
  LatLng,
  AnalysisTask,
  ProfileRequest,
  ProfileResponse,
  TransitModes,
  LegMode,
} from './r5-types';
import {Route} from '../route';
import {QueryOptions} from '../../src/datastore'; // TODO: is this the best way to import query options?
import {SECONDS_PER_HOUR, profileResponseToRoute} from './route-converter';

async function requestPromise<T>(options: request.CoreOptions & request.UrlOptions): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    request(options, (error, response, body) => {
      if (error) {
        reject(error);
      } else {
        resolve(body);
      }
    });
  });
}
class R5Router {
  private routerUrl: string;

  constructor(url: string) {
    this.routerUrl = url;
  }

  /** Get directions from an origin to a destination (one-to-one). */
  public async getRoute(
    origin: LatLng,
    destination: LatLng,
    options?: QueryOptions,
  ): Promise<Route> {
    const req: ProfileRequest = paramsToProfileRequest(origin, destination, options);
    const url = this.routerUrl + '/route';
    const body = await requestPromise<ProfileResponse>({
      url,
      method: 'POST',
      json: true,
      body: req,
    });
    return profileResponseToRoute(origin, destination, body);
  }

  public async getTravelTimes(origin: LatLng, options?: QueryOptions) {
    const req: AnalysisTask = paramsToProfileRequest(origin, null, options);
    req.type = 'TRAVEL_TIME_SURFACE';

    const url = this.routerUrl + '/travelTimeMap';
    const body = await requestPromise<Map<String, Object>>({
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
  destination?: LatLng,
  options?: QueryOptions,
): ProfileRequest {
  // Defaults to transit mode
  let transitModes: TransitModes[] = [TransitModes.TRANSIT];
  let directModes: LegMode[] = [LegMode.WALK];

  let req: ProfileRequest = {
    fromLat: origin.lat,
    fromLon: origin.lng,
    date: '2017-10-16',
    // When we add multimodal availability like bike-to-transit, access and egress modes will become options as well.
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
    if (!(options.travel_mode === TransitModes.TRANSIT.toString())) {
      transitModes = [];
      directModes = [(<any>LegMode)[options.travel_mode]];
      req.directModes = directModes.join();
      req.transitModes = transitModes.join();
    }

    if (options.departure_time) {
      const date = `${req.date}T${options.departure_time}`;
      const departureTime: Date = new Date(0);
      departureTime.setUTCMilliseconds(Date.parse(date));
      const secondsSinceMidnight: number = departureTime.getHours() * SECONDS_PER_HOUR;
      req.fromTime = secondsSinceMidnight;
      req.toTime = secondsSinceMidnight + 2 * SECONDS_PER_HOUR;
    }
    req.wheelchair = options.require_wheelchair;
  }

  return req;
}

export default R5Router;
