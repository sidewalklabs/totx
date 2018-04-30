/**
 * All actions which can be taken within the Transit Accessibility UI.
 */

import {LatLng} from './latlng';

import {QueryOptions} from './datastore';

export type Mode = 'single' | 'compare-origin' | 'compare-settings';

export interface SetMode {
  type: 'set-mode';
  mode: Mode;
}

export interface SetDestination {
  type: 'set-destination';
  lat: number;
  lng: number;
}

export interface ClearDestination {
  type: 'clear-destination';
}

export interface ReportError {
  type: 'report-error';
  error: Error;
}

export interface MapReady {
  type: 'map-ready';
}

export interface SearchForUserEnteredAddress {
  type: 'search-for-user-entered-address';
  address: string;
}

export interface SetUserEnteredAddress {
  type: 'set-user-entered-address';
  address: string;
}

export interface SetOrigin {
  type: 'set-origin';
  origin: LatLng;
  isSecondary?: boolean;
}

export interface SetOptions {
  type: 'set-options';
  isSecondary?: boolean;
  options: Partial<QueryOptions>;
}

export interface SetStory {
  type: 'set-story';
  story: string;
}

type Action =
  | ClearDestination
  | MapReady
  | SearchForUserEnteredAddress
  | SetDestination
  | SetMode
  | SetOptions
  | SetUserEnteredAddress
  | SetOrigin
  | SetStory
  | ReportError;

export default Action;
