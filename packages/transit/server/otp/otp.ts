/**
 * Wrapper around the OpenTripPlanner (OTP) one-to-many and one-to-one routing API.
 *
 * This supports a variety of queries that the SWL router cannot, e.g. cycling
 * times, driving directions and realistic walks in transit routes.
 */

import * as qs from 'qs';
import * as request from 'request';

import {Route} from '../route';
import {IndicatorResponse, LatLng, Options, PlanResponse, SurfaceResponse} from './otp-types';
import {planToRoute} from './route-converter';

function latLngToString(pt: LatLng): string {
  return pt.lat.toFixed(8) + ',' + pt.lng.toFixed(8);
}

function optionsToQueryParams(options: Options): string {
  // This is simple for now, but we might need to do more transforms in the future.
  return qs.stringify(options);
}

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

class OTPRouter {
  // OTP requires a "surface" for each origin. These are created via POST request.
  // This request adds latency so, if you're twiddling with parameters for a single
  // origin, caching these will help.
  // This will have undesirable consequences if the OTP server ever restarts. See
  // https://github.com/opentripplanner/OpenTripPlanner/issues/2423
  private surfaceIds: {[latLng: string]: number};

  constructor(private endpoint: string) {
    this.surfaceIds = {};
  }

  // A surface in OTP refers to all the routes originating at a point with a particular mode.
  private async getSurfaceId(origin: LatLng, mode: string) {
    const key = mode + latLngToString(origin);
    const surface = this.surfaceIds[key];
    if (surface) return surface;

    const url = `${this.endpoint}/surfaces?batch=true&mode=${mode}&fromPlace=${key}`;
    const body = await requestPromise<SurfaceResponse>({
      url,
      method: 'POST',
      json: true,
    });
    return body.id;
  }

  // The OTP "indicator" request evaluates a "surface" at all the points on a PointSet.
  private async getIndicator(
    surfaceId: number,
    destinationPointSet: string,
    options: Options = {},
  ) {
    const params = {
      ...options,
      detail: true,
      targets: destinationPointSet,
    };
    const url = `${this.endpoint}/surfaces/${surfaceId}/indicator?${optionsToQueryParams(params)}`;
    const body = await requestPromise<IndicatorResponse>({
      url,
      method: 'GET',
      json: true,
    });
    return body.times;
  }

  /**
   * Get travel times from an origin to a set of destinations (one-to-many).
   *
   * The destination PointSet must be loaded into OpenTripPlanner for this to work.
   * The returned values are travel times in seconds. They're in the same order as the
   * points in the OTP PointSet file.
   */
  public async getTravelTimes(
    origin: LatLng,
    destinationPointSet: string,
    options: Options,
  ): Promise<number[]> {
    const surfaceId = await this.getSurfaceId(origin, options.mode);
    return this.getIndicator(surfaceId, destinationPointSet, options);
  }

  /** Get directions from an origin to a destination (one-to-one). */
  public async getRoute(origin: LatLng, destination: LatLng, options?: Options): Promise<Route> {
    const oStr = latLngToString(origin);
    const dStr = latLngToString(destination);
    const params = optionsToQueryParams({
      ...options,
      fromPlace: oStr,
      toPlace: dStr,
    } as any);
    const url = `${this.endpoint}/routers/default/plan?${params}`;
    const body = await requestPromise<PlanResponse>({url, json: true});

    return planToRoute(body.plan);
  }
}

export default OTPRouter;
