/**
 * All actions which can be taken within the Transit Accessibility UI.
 */

import {LatLng} from '../../coordinates';
import {BoxPlusLevel} from '../../overlaymap';

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

export interface UpdateBounds {
  type: 'update-bounds';
  bounds: BoxPlusLevel;
}

export interface ReportError {
  type: 'report-error';
  error: Error;
}

export interface MapReady {
  type: 'map-ready';
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
  | SetDestination
  | SetMode
  | SetOptions
  | SetOrigin
  | SetStory
  | ReportError
  | UpdateBounds;

export default Action;
