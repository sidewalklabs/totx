import * as Cookies from 'js-cookie';
import * as topojson from 'topojson-client';
import * as _ from 'underscore';
import * as ramps from './ramps';

import {transformGeometryLatLngToGoogle, CenterZoomLevel, LatLng} from '../../coordinates';
import {ajaxPromise, FeatureCollection} from '../../utils';
import {LegMode, TransitModes} from '../common/r5-types';
import Action, * as actions from './action';

import {StyleFn} from '../../overlaymap';
import {getPromise} from '../../utils';
import Cache from '../../utils/cache';
import Stories from './stories';
import {withoutDefaults} from './utils';

/** This is the state exported by this store via store.getState(). */
export interface State {
  geojson: FeatureCollection;
  destination: LatLng;
  destinationAddress: string;
  view: CenterZoomLevel;
  mode: actions.Mode;
  style: StyleFn;
  error: string;
  isLoading: boolean;
  origin: LatLng;
  originAddress: string;
  options: Partial<QueryOptions>;
  // origin2 and options2 are always set but have no effect on the UI unless mode=comparison.
  origin2: LatLng;
  origin2Address: string;
  options2: Partial<QueryOptions>;
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
  geojson: FeatureCollection;
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

const INITIAL_VIEW: CenterZoomLevel = {
  center: new LatLng(INTRO_STORY.center.lat, INTRO_STORY.center.lng),
  zoomLevel: INTRO_STORY.zoomLevel,
};

export const DEFAULT_OPTIONS: QueryOptions = {
  departure_time: '08:00:00',
  max_walking_distance_km: 0.8, // 0.5 miles
  walking_speed_kph: 4.8, // 3 mph
  max_waiting_time_secs: 1800, // 30 minutes
  transfer_penalty_secs: 300, // 5 minues
  max_number_of_transfers: 1,
  travel_mode: 'TRANSIT',
  bus_multiplier: -1, // no buses by default (performance optimization)
  rail_multiplier: 1,
  exclude_routes: [],
  exclude_stops: [],
  require_wheelchair: false,
};

// This is the structure of cache.json
// It stores the contents of the address, route and commute times caches to reduce network requests.
// The keys and values match the k/v types for their respective caches, except for
// commuteTimesCache. It uses a more compact representation. See dumpCache() for details.
interface SavedCache {
  addressCache: {[key: string]: string};
  routesCache: {[key: string]: Route};
  commuteTimesCache: {[key: string]: number[]};
}

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
    f.geometry = transformGeometryLatLngToGoogle(f.geometry);
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

  const address = (num ? `${num} ${route}` : route || '') + `\n${line2}`;
  return address;
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
  let geojson: FeatureCollection = null;
  let destination: LatLng = null;
  let isLoadingGeoJSON: boolean = false;
  let error: string = null;
  let style: StyleFn = () => ({});
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
  let initPromise: Promise<void> = null; // Promise to track when geometries and caches are loaded.

  const initialHash = window.location.hash;

  const commuteTimesCache = new Cache({
    fetch: fetchCommuteTimes,
    stringify: (key: CommuteTimesKey) => key.origin.toString() + ' ' + JSON.stringify(key.options),
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

  // Neither of these are part of state; they're observed from the map and
  // used for making links and requests.
  let passiveViewport: CenterZoomLevel;

  function handleAction(action: Action) {
    // Note: to ensure that gaEnabled works as intended, action handlers shouldn't make asynchronous
    // recursive calls to handleAction.
    if (gaEnabled && action.type !== 'update-bounds' && action.type !== 'map-ready') {
      ga('send', 'event', 'UI', action.type);
    }

    switch (action.type) {
      case 'set-destination':
        setDestination(action);
        break;
      case 'clear-destination':
        deselect();
        break;
      case 'update-bounds':
        updateBounds(action);
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

  function updateBounds(action: actions.UpdateBounds) {
    const bounds = action.bounds;
    passiveViewport = {center: bounds.center, zoomLevel: bounds.zoomLevel};

    // There's no need to go through a full state update when the viewport changes, and doing so is
    // a significant performance hit. Just updating the hash makes panning much smoother.
    updateHash();
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

    initPromise.then(() => {
      // We do this after initialization to make sure that the caches are filled.
      setStateFromUrlParams(obj);
    });
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

  function getStyleFn() {
    const times = commuteTimesCache.getFromCache({origin, options}) || {};
    if (mode === 'single') {
      return (feature: any) => {
        const id = feature.properties['geo_id'];
        const secs = times[id];
        return {
          fillColor: secs !== null ? ramps.SINGLE(secs) : 'rgba(0,0,0,0)',
          lineWidth: 0,
        };
      };
    }

    const times2 = commuteTimesCache.getFromCache(getSecondaryParams()) || {};
    const secsOrBig = (secs: number) => (secs === null ? 10000 : secs);
    const ramp = mode === 'compare-origin' ? ramps.ORIGIN_COMPARISON : ramps.SETTINGS_COMPARISON;
    return (feature: any) => {
      const id = feature.properties['geo_id'];
      const secs1 = times[id];
      const secs2 = times2[id];
      return {
        fillColor:
          secs1 !== null || secs2 !== null
            ? ramp(secsOrBig(secs1) - secsOrBig(secs2))
            : 'rgba(0,0,0,0)',
        lineWidth: 0,
      };
    };
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

  function handleSetMode(action: actions.SetMode) {
    if (action.mode === mode) return; // no-op
    mode = action.mode;

    getCommuteTimePromises()
      .then(() => {
        style = getStyleFn();
        stateChanged();
      })
      .catch(stateChanged);

    // If there's a second origin, we need to fetch its address.
    if (mode === 'compare-origin') {
      addressCache.get(origin2).then(stateChanged, stateChanged);
    }
    // If you switch from single to compare-settings, start with identical settings.
    if (mode === 'compare-settings') {
      options2 = {...options};
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

    style = getStyleFn();
    stateChanged();
  }

  function handleSetOrigin(action: actions.SetOrigin) {
    if (action.isSecondary) {
      origin2 = action.origin;
    } else {
      origin = action.origin;
    }

    getCommuteTimePromises().then(() => {
      style = getStyleFn();
      stateChanged();
    });
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
      .then(() => {
        style = getStyleFn();
        stateChanged();
      })
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
      isLoadingGeoJSON ||
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

  function orderedFeatureIds() {
    return geojson.features.map(f => f.properties.geo_id as string);
  }

  // This dumps the contents of all the caches into a copy/paste-friendly textarea.
  // Navigate through the scenarios, then run dumpCache() in the console.
  if (!process.env || process.env.NODE_ENV !== 'production') {
    const dumpCache = () => {
      const ids = orderedFeatureIds();
      // The address and routes caches are reasonably small.
      // The commute times are not, but they can be greatly shrunk by dropping the keys and
      // rounding the commute times. It's important to round them _up_, so that the
      // max_commute_time_secs option for route generation is still valid.
      function simplifyCommuteTimes(v: CommuteTimes): number[] {
        return ids.map(id => (v[id] === null ? null : Math.ceil(v[id])));
      }

      const out: SavedCache = {
        addressCache: addressCache.dump(),
        routesCache: routesCache.dump(),
        commuteTimesCache: _.mapObject(commuteTimesCache.dump(), simplifyCommuteTimes),
      };

      const el = document.createElement('textarea');
      el.style.position = 'absolute';
      el.style.top = '0';
      el.style.left = '0';
      el.rows = 40;
      el.cols = 80;
      el.textContent = JSON.stringify(out);
      document.body.appendChild(el);
    };
    (window as any)['dumpCache'] = dumpCache;
  }

  function restoreCaches(cacheJson: SavedCache) {
    const ids = orderedFeatureIds();
    const commuteTimes = _.mapObject(
      cacheJson.commuteTimesCache,
      times => _.object(ids, times) as CommuteTimes,
    );

    addressCache.load(cacheJson.addressCache);
    routesCache.load(cacheJson.routesCache);
    commuteTimesCache.load(commuteTimes);
  }

  function initialize() {
    isLoadingGeoJSON = true;
    initPromise = Promise.all([
      ajaxPromise<any>('toronto.topojson'),
      ajaxPromise<any>('caches.json'),
    ]).then(([torontoTopojson, cacheJson]) => {
      isLoadingGeoJSON = false;
      const torontoGeojson = topojson.feature(torontoTopojson, torontoTopojson.objects['-']);
      torontoGeojson.features.forEach((feature: any) => {
        feature.id = feature.properties.geo_id;
      });
      geojson = torontoGeojson;
      restoreCaches(cacheJson);
      stateChanged();

      handleSetOrigin({
        type: 'set-origin',
        origin,
      });
    });
  }

  function constructHash() {
    const obj: UrlParams = {origin, options: withoutDefaults(options, DEFAULT_OPTIONS)};
    if (passiveViewport) {
      const {lat, lng} = passiveViewport.center;
      _.extend(obj, {
        center: {lat, lng},
        zoomLevel: passiveViewport.zoomLevel,
      });
    }

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
    return {
      geojson,
      destination,
      destinationAddress: destination && addressCache.getFromCache(destination),
      style,
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
