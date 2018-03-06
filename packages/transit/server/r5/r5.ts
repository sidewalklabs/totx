/**
 * Wrapper around the R5 one-to-many and one-to-one routing API.
 */

import * as qs from 'qs';
import * as request from 'request';

import {Route} from '../route';
//import {IndicatorResponse, LatLng, Options, PlanResponse, SurfaceResponse} from './r5-types';
//import {planToRoute} from './route-converter';


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

    constructor(private endpoint: string) {
    }
  
  /**
   * Get travel times from an origin to a set of destinations (one-to-many).
   *
   * The destination PointSet must be loaded into R5 for this to work.
   * The returned values are travel times in seconds. They're in the same order as the
   * points in the R5 PointSet file.
   */
  public async getTravelTimes(
    origin: LatLng,
    destinationPointSet: string,
    options: Options,
  ): Promise<Map<String, number> {

  }

  /** Get directions from an origin to a destination (one-to-one). */
  public async getRoute(origin: LatLng, destination: LatLng, options?: Options): Promise<Route> {
    
  }
}

export default R5Router;