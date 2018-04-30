import * as Cookies from 'js-cookie';
import * as _ from 'underscore';

import {FeatureCollection} from '../../utils';
import {LegMode, TransitModes} from '../common/r5-types';
import Action, * as actions from './action';
import {CenterZoomLevel, LatLng} from './latlng';

import {getPromise} from '../../utils';
import Cache from '../../utils/cache';
import {SummaryStep} from '../server/route';
import Stories from './stories';
import {withoutDefaults} from './utils';

/** This is the state exported by this store via store.getState(). */
export interface State {
  destination: LatLng;
  destinationAddress: string;
  view: CenterZoomLevel;
  mode: actions.Mode;
  error: string;
  isLoading: boolean;
  origin: LatLng;
  originAddress: string;
  options: Partial<QueryOptions>;
  times: CommuteTimes;
  // origin2 and options2 are always set but have no effect on the UI unless mode=comparison.
  origin2: LatLng;
  origin2Address: string;
  options2: Partial<QueryOptions>;
  times2: CommuteTimes;
  routes: Route[];
  currentStory: string;
}

export interface Step {
  from: any; // either a stop or one of the user-specified locations
  to: any; // either a stop or one of the user-specified locations
  mode: LegMode | TransitModes;
  departTimeSecs: number;
  arriveTimeSecs: number;
  travelTimeSecs: number;
  numStops?: number; // for transit
  tripId?: string; // for transit
  routeId?: string; // for transit
  distanceKm?: number; // e.g. for walking
  description: string;
}

interface Location {
  id: string;
  latitude: string;
  longitude: string;
}

export interface Route {
  origin: Location;
  destination: Location;
  departureSecs: number;
  arriveTimeSecs: number;
  travelTimeSecs: number;
  distanceKm: number;
  geojson: FeatureCollection;
  summary: SummaryStep[];
  steps: Step[];
}

interface LatLngObject {
  lat: number;
  lng: number;
}

// (This matches the interface in router/options.ts.)
export interface QueryOptions {
  departure_time: string;
  max_walking_distance_km: number;
  walking_speed_kph: number;
  bike_speed_kph: number;
  max_waiting_time_secs: number;
  transfer_penalty_secs: number;
  max_number_of_transfers: number;
  travel_mode: string;
  bus_multiplier: number;
  rail_multiplier: number;
  exclude_routes: string[];
  exclude_stops: string[];
  require_wheelchair: boolean;
}

/** A JSON-serialized version of this object appears in the URL hash. */
export interface UrlParams {
  origin: LatLngObject;
  options: Partial<QueryOptions>;
  mode?: actions.Mode;
  origin2?: LatLngObject;
  options2?: Partial<QueryOptions>;
  dest?: LatLngObject;
  // Viewport settings
  center?: LatLngObject;
  zoomLevel?: number;
  scenario?: string;
}

const INTRO_STORY = Stories['intro'];

const GTO = {
  south: 43.0,
  west: -79.978031,
  east: -79.179731,
  north: 44.383158,
};

const GTO_BOUNDS = new google.maps.LatLngBounds(
  new google.maps.LatLng(GTO.south, GTO.west),
  new google.maps.LatLng(GTO.north, GTO.east),
);

const INITIAL_VIEW: CenterZoomLevel = {
  center: new LatLng(INTRO_STORY.center.lat, INTRO_STORY.center.lng),
  zoomLevel: INTRO_STORY.zoomLevel,
};

export const DEFAULT_OPTIONS: QueryOptions = {
  departure_time: '08:00:00',
  max_walking_distance_km: 0.8, // 0.5 miles
  walking_speed_kph: 4.8, // 3 mph
  max_waiting_time_secs: 1800, // 30 minutes
  bike_speed_kph: 14.4, // 4 m/s
  transfer_penalty_secs: 300, // 5 minutes
  max_number_of_transfers: 1,
  travel_mode: 'TRANSIT',
  bus_multiplier: -1, // no buses by default (performance optimization)
  rail_multiplier: 1,
  exclude_routes: [],
  exclude_stops: [],
  require_wheelchair: false,
};

interface CommuteTimes {
  [bgId: string]: number;
}

interface CommuteTimesKey {
  origin: LatLng;
  options: QueryOptions;
}

function fetchCommuteTimes(key: CommuteTimesKey) {
  const {origin, options} = key;
  const {lat, lng} = origin;
  return getPromise<CommuteTimes>('one-to-city', {
    origin: {lat, lng},
    departureTime: options.departure_time,
    options,
  });
}

interface RoutesKey {
  origin: LatLng;
  destination: LatLng;
  options: QueryOptions;
}

async function fetchRoute(key: RoutesKey): Promise<Route> {
  const params = {
    origin: {lat: key.origin.lat, lng: key.origin.lng},
    departureTime: key.options.departure_time,
    destination: {lat: key.destination.lat, lng: key.destination.lng},
    options: key.options,
  };
  const route = await getPromise<Route>('route', params);

  if (!route || !route.geojson) {
    throw new Error('Unable to load route');
  }
  route.geojson.features.forEach((f, i) => {
    if (!f.id) f.id = 'route-' + i;
  });

  return route;
}

function formatAddress(result: google.maps.GeocoderResult) {
  const componentByType = {} as {[type: string]: string};
  for (const component of result.address_components) {
    for (const type of component.types) {
      componentByType[type] = component.short_name;
    }
  }

  const num = componentByType['street_number'];
  const route = componentByType['route']; // e.g. '34th Street'
  const neighborhood = componentByType['neighborhood'];
  const borough = componentByType['sublocality'];
  const city = componentByType['locality'];
  const state = componentByType['administrative_area_level_1'];

  let line2 = `${borough || city}, ${state}`;
  if (neighborhood) line2 = `${neighborhood}, ${line2}`;

  const address = (num ? `${num} ${route}` : route || '') + ` \n${line2}`;
  return address;
}

async function geocode(
  geocoder: google.maps.Geocoder,
  address: string,
): Promise<google.maps.GeocoderResult | null> {
  return new Promise<google.maps.GeocoderResult>((resolve, reject) => {
    geocoder.geocode({address, bounds: GTO_BOUNDS}, (results, status: any) => {
      if (status !== 'OK') {
        reject(status);
      } else {
        const withinBounds = _.find(results, checkBounds);
        if (withinBounds === undefined) {
          reject(new Error(`No matching locations found for: ${address}`));
        } else {
          resolve(withinBounds);
        }
      }
    });
  });
}

function checkBounds(geocode_result: google.maps.GeocoderResult) {
  const {location} = geocode_result.geometry;
  return (
    location.lng() > GTO.west &&
    location.lng() < GTO.east &&
    location.lat() > GTO.south &&
    location.lat() < GTO.north
  );
}

async function reverseGeocode(geocoder: google.maps.Geocoder, location: LatLng): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    geocoder.geocode({location}, (results, status: any) => {
      if (status !== 'OK') {
        // The typings say this is a number, but it's a string.
        resolve('Unknown location');
      } else {
        resolve(formatAddress(results[0]));
      }
    });
  });
}

const COOKIE_NAME = 'hide-scenario';

function createStore() {
  // this is used to programmatically pan and zoom the map.
  let view: CenterZoomLevel = INITIAL_VIEW;
  let destination: LatLng = null;
  let error: string = null;
  let origin: LatLng = new LatLng(INTRO_STORY.origin.lat, INTRO_STORY.origin.lng);
  let options = {...DEFAULT_OPTIONS, ...INTRO_STORY.options};
  let origin2: LatLng = new LatLng(
    Stories['noTransfers'].dest.lat,
    Stories['noTransfers'].dest.lng,
  );
  let options2 = {...DEFAULT_OPTIONS, ...INTRO_STORY.options2};
  let mode: actions.Mode = INTRO_STORY.mode;
  const geocoder = new google.maps.Geocoder();
  // Default to the "intro" scenario unless the user has previously closed the scenarios bar.
  let currentStory: string = null; // Cookies.get(COOKIE_NAME) ? null : 'intro';

  let gaEnabled = true; // track events with Google Analytics?

  const initialHash = window.location.hash;

  const commuteTimesCache = new Cache({
    fetch: fetchCommuteTimes,
    stringify: (key: CommuteTimesKey) => key.origin.toString() + ' ' + JSON.stringify(key.options),
  });

  const geocodeCache = new Cache({
    fetch: (key: string) => geocode(geocoder, key),
    stringify: (key: string) => key,
  });

  const routesCache = new Cache({
    fetch: fetchRoute,
    stringify: (key: RoutesKey) =>
      [key.origin.toString(), key.destination.toString(), JSON.stringify(key.options)].join(' '),
  });

  const addressCache = new Cache({
    fetch: (key: LatLng) => reverseGeocode(geocoder, key),
    stringify: (key: LatLng) => key.toString(),
  });

  function handleAction(action: Action) {
    // Note: to ensure that gaEnabled works as intended, action handlers shouldn't make asynchronous
    // recursive calls to handleAction.
    if (gaEnabled && action.type !== 'map-ready') {
      ga('send', 'event', 'UI', action.type);
    }

    switch (action.type) {
      case 'set-destination':
        setDestination(action);
        break;
      case 'clear-destination':
        deselect();
        break;
      case 'report-error':
        reportError(action);
        break;
      case 'map-ready':
        handleMapReady();
        break;
      case 'set-origin':
        handleSetOrigin(action);
        break;
      case 'set-mode':
        handleSetMode(action);
        break;
      case 'set-options':
        handleSetOptions(action);
        break;
      case 'set-story':
        handleSetStory(action);
        break;
      case 'search-for-user-entered-address':
        handleSearchForUserEnteredAddress(action);
        break;
      default:
        console.error('Unhandled action', action);
    }
  }

  function fetchRoutes() {
    if (destination) {
      routesCache.get({origin, options, destination}).then(stateChanged, stateChanged);
      const secondaryParams = getSecondaryParams();
      if (secondaryParams) {
        routesCache.get({...secondaryParams, destination}).then(stateChanged, stateChanged);
      }
    }
  }

  function setDestination(action: actions.SetDestination) {
    destination = new LatLng(action.lat, action.lng);
    fetchRoutes();
    addressCache.get(destination).then(stateChanged, stateChanged);
    stateChanged();
  }

  function deselect() {
    destination = null;
    stateChanged();
  }

  function reportError(action: actions.ReportError) {
    if (action.error) {
      error = action.error.toString();
    } else {
      error = null;
    }
    stateChanged();
  }

  function handleMapReady() {
    const hash = decodeURIComponent(initialHash).slice(1);
    if (!hash) return;

    let obj: UrlParams;
    try {
      obj = JSON.parse(hash);
    } catch (e) {
      return; // the hash wasn't JSON.
    }

    setStateFromUrlParams(obj);
  }

  function setStateFromUrlParams(obj: UrlParams) {
    // This function is implemented using actions, which messes with tracking.
    // To avoid cluttering event history, we temporarily disable it while the state updates.
    gaEnabled = false;

    if (obj.scenario) {
      handleAction({
        type: 'set-story',
        story: obj.scenario,
      });
    } else {
      if (obj.center) {
        const {lat, lng} = obj.center;
        view = {
          center: new LatLng(lat, lng),
          zoomLevel: obj.zoomLevel || INITIAL_VIEW.zoomLevel,
        };
        stateChanged();
      }
      handleAction({type: 'set-mode', mode: obj.mode || 'single'});

      if (obj.origin) {
        if (obj.options) options = {...DEFAULT_OPTIONS, ...obj.options};
        handleAction({
          type: 'set-origin',
          origin: new LatLng(obj.origin.lat, obj.origin.lng),
        });
      }
      if (obj.origin2) {
        handleAction({
          type: 'set-origin',
          origin: new LatLng(obj.origin2.lat, obj.origin2.lng),
          isSecondary: true,
        });
      }
      if (obj.options2) {
        handleAction({
          type: 'set-options',
          isSecondary: true,
          options: {...DEFAULT_OPTIONS, ...obj.options2},
        });
      }
      if (obj.dest) {
        handleAction({
          type: 'set-destination',
          ...obj.dest,
        });
      } else {
        handleAction({type: 'clear-destination'});
      }
    }
    gaEnabled = true;
  }

  function getSecondaryParams(): CommuteTimesKey {
    switch (mode) {
      case 'single':
        return null;
      case 'compare-origin':
        return {origin: origin2, options};
      case 'compare-settings':
        return {origin, options: options2};
    }
  }

  async function getCommuteTimePromises(): Promise<CommuteTimes[]> {
    const secondaryParams = getSecondaryParams();
    const secondaryPromise = secondaryParams
      ? commuteTimesCache.get(secondaryParams)
      : Promise.resolve(null);

    const promises = [commuteTimesCache.get({origin, options})];
    if (secondaryPromise) {
      promises.push(secondaryPromise);
    }
    return Promise.all(promises);
  }

  function getCommuteTimes() {
    const times = commuteTimesCache.getFromCache({origin, options}) || {};
    let times2 = {};
    if (mode !== 'single') {
      times2 = commuteTimesCache.getFromCache(getSecondaryParams()) || {};
    } else {
      times2 = {};
    }
    return {times, times2};
  }

  function handleSetMode(action: actions.SetMode) {
    if (action.mode === mode) return; // no-op
    mode = action.mode;

    // If we've switched to compare settings mode, make sure the two settings are different.
    if (mode === 'compare-settings' && options.travel_mode === options2.travel_mode) {
      if (options.travel_mode === 'TRANSIT') {
        options2.travel_mode = 'BICYCLE';
      } else {
        options2.travel_mode = 'TRANSIT';
      }
    }

    getCommuteTimePromises()
      .then(stateChanged)
      .catch(stateChanged);

    // If there's a second origin, we need to fetch its address.
    if (mode === 'compare-origin') {
      addressCache.get(origin2).then(stateChanged, stateChanged);
    }

    const secondaryParams = getSecondaryParams();
    if (destination && secondaryParams) {
      routesCache
        .get({
          ...secondaryParams,
          destination,
        })
        .then(stateChanged, stateChanged);
    }

    stateChanged();
  }

  async function handleSearchForUserEnteredAddress(action: actions.SearchForUserEnteredAddress) {
    try {
      const geocodeResults = await geocodeCache.get(action.address);
      const {location} = geocodeResults.geometry;
      const lat = location.lat();
      const lng = location.lng();
      const latLng = new LatLng(lat, lng);
      view = {
        center: latLng,
        zoomLevel: view.zoomLevel || INITIAL_VIEW.zoomLevel,
      };
      handleAction({type: 'set-origin', origin: latLng});
    } catch (err) {
      handleAction({type: 'report-error', error: err});
    }
  }

  function handleSetOrigin(action: actions.SetOrigin) {
    if (action.isSecondary) {
      origin2 = action.origin;
    } else {
      origin = action.origin;
    }

    getCommuteTimePromises().then(stateChanged);
    fetchRoutes();
    addressCache.get(action.origin).then(stateChanged, stateChanged);
    stateChanged();
  }

  function handleSetOptions(action: actions.SetOptions) {
    if (action.isSecondary) {
      options2 = _.extend({}, options2, action.options);
    } else {
      options = _.extend({}, options, action.options);
    }

    getCommuteTimePromises()
      .then(stateChanged)
      .catch(stateChanged);
    fetchRoutes();

    stateChanged(); // update "loading" indicator
  }

  function handleSetStory(action: actions.SetStory) {
    currentStory = action.story;
    if (currentStory) {
      const story = Stories[currentStory];
      setStateFromUrlParams(story);
      Cookies.remove(COOKIE_NAME);
    } else {
      stateChanged();
      Cookies.set(COOKIE_NAME, 'true');
    }
  }

  function areTherePendingRequests() {
    return (
      commuteTimesCache.numPendingFetches() > 0 ||
      routesCache.numPendingFetches() > 0 ||
      addressCache.numPendingFetches() > 0
    );
  }

  function getRoutes() {
    if (!destination) return [];
    const routes = [] as Route[];

    const route1 = routesCache.getFromCache({origin, options, destination});
    routes.push(route1);

    const secondaryParams = getSecondaryParams();
    if (secondaryParams) {
      const route2 = routesCache.getFromCache({...secondaryParams, destination});
      routes.push(route2);
    }
    return routes;
  }

  function initialize() {
    handleSetOrigin({
      type: 'set-origin',
      origin,
    });
  }

  function constructHash() {
    const obj: UrlParams = {origin, options: withoutDefaults(options, DEFAULT_OPTIONS)};

    if (mode !== 'single') {
      obj.mode = mode;
      if (mode === 'compare-origin') {
        obj.origin2 = origin2;
      } else if (mode === 'compare-settings') {
        obj.options2 = withoutDefaults(options2, DEFAULT_OPTIONS);
      }
    }
    if (destination) {
      obj.dest = {
        lat: destination.lat,
        lng: destination.lng,
      };
    }
    return JSON.stringify(obj);
  }

  // We de-bounce this to prevent updating the URL on every frame while the user is panning the map.
  const updateHash = _.debounce(() => {
    window.location.hash = constructHash();
  }, 500);

  const subscribers = [] as Array<() => any>;
  function stateChanged() {
    updateHash();
    subscribers.forEach(fn => fn());
  }

  function getState(): State {
    const {times, times2} = getCommuteTimes();
    return {
      destination,
      destinationAddress: destination && addressCache.getFromCache(destination),
      times,
      error,
      isLoading: areTherePendingRequests(),
      mode,
      view,
      origin,
      originAddress: addressCache.getFromCache(origin),
      options,
      origin2,
      origin2Address: addressCache.getFromCache(origin2),
      options2,
      times2,
      routes: getRoutes(),
      currentStory,
    };
  }

  initialize();

  return {
    getState,
    dispatch(action: Action) {
      handleAction(action);
    },
    subscribe(callback: () => any) {
      subscribers.push(callback);
    },
  };
}

export default createStore;
