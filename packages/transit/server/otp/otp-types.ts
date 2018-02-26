/**
 * Types for the OpenTripPlanner (OTP) API.
 */

export interface LatLng {
  lat: number;
  lng: number;
}

/** Routing parameters, e.g. walking/cycling speed */
export interface Options {
  routerId?: string; // not entirely clear what options are for this.

  time?: string; // e.g. '3:45pm'
  date?: string; // e.g. '2017-03-14'
  mode?: string; // e.g. 'WALK', 'TRANSIT,WALK', 'BICYCLE', 'CAR'

  maxTransfers?: number;
  maxWalkDistance?: number; // in meters
  minTransferTime?: number; // in seconds
  transferPenalty?: number; // in "OTP's internal weight units, roughly equivalent to seconds."

  // For cycling. These three are in [0, 1] and should add to 1.
  triangleSafetyFactor?: number;
  triangleSlopeFactor?: number;
  triangleTimeFactor?: number;

  walkSpeed?: number; // in meters/sec. Defaults to approximately 3 MPH.
  bikeSpeed?: number; // Cycling speed in meters/sec.  Defaults is ~11 MPH, or 9.5 for bikeshare.

  wheelchair?: boolean;

  // ... there are many more options than these.
  // see http://dev.opentripplanner.org/apidoc/1.0.0/resource_SurfaceResource.html
}

/** Response type for the /otp/surfaces endpoint. */
export interface SurfaceResponse {
  id: number;
  params: any;
}

/** Response type for the /otp/surfaces/{n}/indicator endpoint. */
export interface IndicatorResponse {
  properties: {
    id: string;
  };
  data: {
    id: {
      sums: number[];
      counts: number[];
    };
  };
  times: number[]; // will be 2^31 - 1 for unreachable locations.
}

export interface OTPPoint {
  name: string;
  lat: number;
  lon: number;
  vertexType: string; // e.g. "NORMAL" or "TRANSIT"
}

export interface OTPLeg {
  startTime: number; // ms
  endTime: number; // ms
  distance: number; // meters
  mode: string; // e.g. 'WALK', 'SUBWAY'
  transitLeg: boolean;
  legGeometry: {
    points: string; // encoded polyline path
    length: number;
  };
  steps: any[];
}

export interface PlanResponse {
  requestParameters: any;
  plan: Plan;
  debugOutput: any;
  elevationMetadata: any;
}

export interface Plan {
  date: number; // ms
  from: OTPPoint;
  to: OTPPoint;
  itineraries: Array<{
    duration: number; // secs
    startTime: number; // ms
    endTime: number; // ms
    walkTime: number; // secs
    transitTime: number; // secs
    waitingTime: number; // secs
    walkDistance: number; // meters
    transfers: number;
    legs: OTPLeg[];
  }>;
}
