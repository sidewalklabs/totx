/**
 * Types for the R5 API.
 * These were copied over from the R5 Router's internal representations and may not include all
 * possible fields.
 */

export interface ProfileRequest {
  fromLat: number;
  fromLon: number;
  toLat?: number;
  toLon?: number;
  fromTime?: number; // secs since midnight
  toTime?: number; // secs since midnight
  date?: string; // LocalDate, e.g. 2017-10-16
  wheelchair?: boolean;
  accessModes?: string; // comma-separated list of LegModes
  egressModes?: string; // comma-separated list of LegModes
  directModes?: string; // comma-separated list of LegModes
  transitModes?: string; // comma-separated list of TransitModes
  bikeSpeed?: number; // speed of biking in meters per second
  verbose?: boolean;
}

export interface AnalysisTask extends ProfileRequest {
  type: string;
}

export enum LegMode {
  WALK = 'WALK',
  BICYCLE = 'BICYCLE',
  CAR = 'CAR',
  BICYCLE_RENT = 'BICYCLE_RENT', // Bikeshare
  CAR_PARK = 'CAR_PARK',
}

export enum TransitModes {
  // Tram, Streetcar, Light rail. Any light rail or street level system within a metropolitan area.
  TRAM = 'TRAM',
  // Subway, Metro. Any underground rail system within a metropolitan area.
  SUBWAY = 'SUBWAY',
  // Rail. Used for intercity or long-distance travel.
  RAIL = 'RAIL',
  // Bus. Used for short- and long-distance bus routes.
  BUS = 'BUS',
  // Ferry. Used for short- and long-distance boat service.
  FERRY = 'FERRY',
  // Cable car. Used for street-level cable cars where the cable runs beneath the car.
  CABLE_CAR = 'CABLE_CAR',
  // Gondola, Suspended cable car. Typically used for aerial cable cars where the car is
  // suspended from the cable.
  GONDOLA = 'GONDOLA',
  // Funicular. Any rail system designed for steep inclines.
  FUNICULAR = 'FUNICULAR',
  // All modes
  TRANSIT = 'TRANSIT',
}

export interface ProfileOption {
  transit: TransitSegment[];
  access: StreetSegment[];
  egress: StreetSegment[];
  itinerary: Array<{
    waitingTime: number; // secs
    walkTime: number; // secs
    distance: number; // mm total distance of all nontransit segments
    transitDistance: number; // mm total distance of all transit segments
    transfers: number; // number of transfers
    duration: number; // secs
    transitTime: number; // secs
    connection: any;
    startTime: ZonedDateTime;
    endTime: ZonedDateTime;
  }>;
  summary: string;
}

export interface ZonedDateTime {
  year: number;
  month: string;
  dayOfMonth: number;
  dayOfWeek: string;
  hour: number;
  minute: number;
  second: number;
}

interface Route {
  agencyName: string;
  id: string;
  mode: TransitModes;
  routeIdx: number;
  shortName: string;
  longName: string;
}

interface TransitSegment {
  mode: TransitModes;
  transitEdges: TransitEdgeInfo[];
  routes: Route[];
  middle: StreetSegment;
}

interface StreetSegment {
  mode: LegMode;
  distance: number;
  duration: number;
  geometryGeoJSON: string;
  streetEdges?: StreetEdgeInfo[];
}

export interface TransitEdgeInfo {
  id: string;
  fromStopID: number;
  fromDepartureTime: ZonedDateTime[];
  toArrivalTime: ZonedDateTime[];
  toStopID: number;
  routeID: string;
  routeColor: string;
  distanceM: number; // in meters
  geometry: GeoJSON.LineString;
}

export interface StreetEdgeInfo {
  edgeId: string;
  distanceMm: number; // in millimeters
  startTime: ZonedDateTime;
  endTime: ZonedDateTime;
  geometry: GeoJSON.LineString;
  mode: LegMode;
  absoluteDirection: String;
  streetName: string;
}

export interface LatLng {
  lat: number;
  lng: number;
}
