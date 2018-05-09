/**
 * Toronto Version
 * Pre-built stories to help users explore the Transit Accessibility tool.
 */

import {UrlParams} from './datastore';

const ONLY_SUBWAY = {rail_multiplier: 1};
const NO_PREFERENCE = {rail_multiplier: 1};

// The downtown point is 307 Lakeshore Blvd.
const DOWNTOWN_POINT = {lat: 43.64630322966252, lng: -79.36180530094046};
const MOORE_PARK_POINT = {lat: 43.691008142491825, lng: -79.38422128757793};
const PALMERSTON_POINT = {lat: 43.661393986924175, lng: -79.41512767576654};

interface Story extends UrlParams {
  header: string;
  subHeader: string;
}

/* tslint:disable:max-line-length */

const stories: {[name: string]: Story} = {
  intro: {
    mode: 'single',
    origin: DOWNTOWN_POINT,
    options: NO_PREFERENCE,
    center: DOWNTOWN_POINT,
    zoomLevel: 12,
    header: 'Try it out!',
    subHeader: `Move the pin around to set your origin (Toronto only). Click a spot on the map to set your destination. Areas in blue-green are quickest to access via transit. Areas in yellow take the longest. Use the arrows to explore more features.`,
  },

  noTransfers: {
    mode: 'single',
    origin: DOWNTOWN_POINT,
    options: {
      max_number_of_transfers: 0,
      ...ONLY_SUBWAY,
    },
    center: DOWNTOWN_POINT,
    zoomLevel: 12,
    dest: MOORE_PARK_POINT,
    header: 'Adjust your settings',
    subHeader: ``,
  },

  oneTransfer: {
    mode: 'single',
    origin: DOWNTOWN_POINT,
    options: ONLY_SUBWAY,
    center: DOWNTOWN_POINT,
    zoomLevel: 12,
    dest: MOORE_PARK_POINT,
    header: 'Add a transfer',
    subHeader: `If you're willing to make a transfer, you can get to more places, faster.`,
  },

  andBus: {
    mode: 'single',
    origin: DOWNTOWN_POINT,
    options: NO_PREFERENCE,
    center: DOWNTOWN_POINT,
    zoomLevel: 12,
    dest: MOORE_PARK_POINT,
    header: 'Take the bus!',
    subHeader: `When you add buses to the mix, you can get to even more places.`,
  },

  busWin: {
    origin: DOWNTOWN_POINT,
    options: NO_PREFERENCE,
    options2: ONLY_SUBWAY,
    center: DOWNTOWN_POINT,
    zoomLevel: 12,
    mode: 'compare-settings',
    dest: MOORE_PARK_POINT,
    header: 'Compare settings',
    subHeader: ``,
  },

  comparison: {
    origin: DOWNTOWN_POINT,
    options: ONLY_SUBWAY,
    center: DOWNTOWN_POINT,
    mode: 'compare-origin',
    origin2: MOORE_PARK_POINT,
    options2: ONLY_SUBWAY,
    zoomLevel: 12,
    dest: PALMERSTON_POINT,
    header: 'Compare origins',
    subHeader: ``,
  },
};

export default stories;
