/**
 * Pre-built stories to help users explore the Transit Accessibility tool.
 */

import {UrlParams} from './datastore';

const ONLY_SUBWAY = {bus_multiplier: -1, rail_multiplier: 1};
const NO_PREFERENCE = {bus_multiplier: 1, rail_multiplier: 1};

const WBURG_POINT = {lat: 40.71890258024803, lng: -73.9559329152832};
const FT_GREENE_POINT = {lat: 40.687772, lng: -73.978498};
const RIDGEWOOD_POINT = {lat: 40.703548367250455, lng: -73.90546447045898};

interface Story extends UrlParams {
  header: string;
  subHeader: string;
}

/* tslint:disable:max-line-length */

const stories: {[name: string]: Story} = {
  intro: {
    mode: 'single',
    origin: RIDGEWOOD_POINT,
    options: NO_PREFERENCE,
    center: {lat: 40.72382748514871, lng: -73.9781213544922},
    zoomLevel: 12,
    header: 'Try it out!',
    subHeader: `Move the pin around to set your origin (NYC only). Click a spot on the map to set your destination. Areas in blue-green are quickest to access via transit. Areas in yellow take the longest. Use the arrows to explore more features.`,
  },

  noTransfers: {
    mode: 'single',
    origin: RIDGEWOOD_POINT,
    options: {
      max_number_of_transfers: 0,
      ...ONLY_SUBWAY,
    },
    center: {lat: 40.72382748514871, lng: -73.9781213544922},
    zoomLevel: 12,
    dest: {
      lat: 40.74829735476796,
      lng: -73.9984130859375,
    },
    header: 'Adjust your settings',
    subHeader: `Here's a rush-hour commute from Ridgewood into midtown Manhattan using only subway options and no transfers.`,
  },

  oneTransfer: {
    mode: 'single',
    origin: RIDGEWOOD_POINT,
    options: ONLY_SUBWAY,
    center: {lat: 40.72382748514871, lng: -73.9781213544922},
    zoomLevel: 12,
    dest: {
      lat: +40.779338,
      lng: -73.9521422,
    },
    header: 'Add a transfer',
    subHeader: `If you're willing to make a transfer, you can get to more places, faster.`,
  },

  andBus: {
    mode: 'single',
    origin: RIDGEWOOD_POINT,
    options: NO_PREFERENCE,
    center: {lat: 40.72382748514871, lng: -73.9781213544922},
    zoomLevel: 12,
    dest: {
      lat: 40.702764986136835,
      lng: -73.8442611694336,
    },
    header: 'Take the bus!',
    subHeader: `When you add buses to the mix, you can get to even more places.`,
  },

  busWin: {
    origin: {
      lat: 40.70878611319876,
      lng: -73.96316415078735,
    },
    options: NO_PREFERENCE,
    options2: ONLY_SUBWAY,
    center: {
      lat: 40.717745227656906,
      lng: -73.99294860592653,
    },
    zoomLevel: 12,
    mode: 'compare-settings',
    dest: {
      lat: 40.67160714671131,
      lng: -73.95034353769529,
    },
    header: 'Compare settings',
    subHeader: `For some trips, buses provide a faster, more direct option. Areas in blue are easier to get to from south Williamsburg using a bus than only using the subway.`,
  },

  comparison: {
    origin: WBURG_POINT,
    options: ONLY_SUBWAY,
    center: {lat: 40.72382748514871, lng: -73.9781213544922},
    mode: 'compare-origin',
    origin2: FT_GREENE_POINT,
    options2: ONLY_SUBWAY,
    zoomLevel: 12,
    dest: {
      lat: +40.779338,
      lng: -73.9521422,
    },
    header: 'Compare origins',
    subHeader: `Areas in blue are more accessible from Williamsburg. Orange areas are more accessible from Fort Greene.`,
  },

  lifeWithoutL: {
    origin: WBURG_POINT,
    center: {lat: 40.7326734130054, lng: -73.98061044445802},
    zoomLevel: 12,
    mode: 'compare-settings',
    options2: ONLY_SUBWAY,
    options: {...ONLY_SUBWAY, exclude_stops: ['L06', 'L05', 'L03', 'L02', 'L01']},
    dest: {
      lat: 40.75931438527439,
      lng: -73.98282810234377,
    },
    header: 'Brace for L-mageddon',
    subHeader: `Areas in red would be harder to get to from Williamsburg without the L train. Move the blue pin to see how the L train shutdown will affect your access.`,
  },
};

export default stories;
