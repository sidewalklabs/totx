import * as firebase from 'firebase/app';
import * as _ from 'underscore';

import {authedFetch} from './auth';

import 'whatwg-fetch';

/** Fetches and expects a JSON object back from the server.
 *  Optionally takes a firebase.User object, for requests that require authentication.
 */
export async function fetchJSON<T>(
  host: string,
  path: string,
  query: {[key: string]: any} = {},
  init: RequestInit = {},
  user?: firebase.User,
): Promise<T> {
  if (path.indexOf('/') !== 0) {
    path = '/' + path;
  }
  const url = buildUrl(`${host}${path}`, query);
  const response = await authedFetch(
    url,
    _.assign(init, {
      headers: _.assign(init.headers || {}, {'Content-Type': 'application/json'}),
      credentials: 'same-origin', // Pass cookies.
    }),
    user,
  );
  const out = await response.json();
  if (!response.ok) {
    throw out;
  }
  return out;
}

// TODO(danieljy): Consolidate the following additional ajax functions with the one above or
// move them out of this package. The are more more onemap specific, but have been used outside of
// the onemap package too.

/**
 * Fix a relative path to be appropriate for the current URL.
 * We use relative paths to allow onemap to be served from a subdirectory; we assume all paths for
 * XHRs are relative to the onemap root. This function adds a leading '../' if necessary based on
 * locationPath (which should be set to the current window.location.pathname).
 * TODO(danieljy): This is onemap specific logic, that shouldn't live in this utils file.
 */
export function fixRelativePath(path: string, locationPath: string): string {
  if (!path.length || path.charAt(0) === '/') {
    return path;
  } else if (locationPath.match(/view\/[0-9]+$/)) {
    // View URLs are one level deep.
    return '../' + path;
  } else {
    return path;
  }
}

/**
 * Issue an XHR and return a promise for the JSON that it returns.
 * Enforces a relative path (requires acces to window) and allows
 * you to specify the method used.
 *
 * NOTE(danieljy): Consider using fetchJSON above, and/or modifying it to suit your needs, as it's
 * more flexible. It also supports firebase auth.
 */
export async function ajaxPromise<T>(path: string, method?: string): Promise<T> {
  method = method || 'GET';
  const request = new Request(fixRelativePath(path, window.location.pathname), {
    credentials: 'same-origin', // Include cookies, e.g. for oauth.
    method,
  });
  const response = await fetch(request);
  if (!response.ok) {
    // Note: this assumes that bad responses still return JSON data.
    const data = await response.json();
    return Promise.reject(data);
  }
  return response.json();
}

/**
 * Issue a GET request with a JSON-encoded object in the query string.
 * Does not enforce relative path and allows passing a json payload.
 */
export async function getPromise<T>(url: string, payload?: any): Promise<T> {
  if (payload) {
    url += '?' + encodeURIComponent(JSON.stringify(payload));
  }
  const response = await fetch(url, {
    credentials: 'same-origin',
    method: 'GET',
  });

  if (!response.ok) {
    return Promise.reject(response.json());
  }

  return response.json();
}

export async function postPromise<T>(path: string, payload: any, opts?: RequestInit): Promise<T> {
  const requestOpts: RequestInit = {
    method: 'POST',
    credentials: 'same-origin',
    ...opts,
  };
  if (payload instanceof FormData) {
    requestOpts.body = payload;
  } else {
    requestOpts.body = JSON.stringify(payload);
    requestOpts.headers = {'Content-Type': 'application/json'};
  }
  const request = new Request(fixRelativePath(path, window.location.pathname), requestOpts);
  const response = await fetch(request);
  if (!response.ok) {
    // Note: this assumes that bad responses still return JSON data.
    const data = await response.json();
    return Promise.reject(data);
  }
  return response.json();
}

/**
 * Map each element of a list to zero, one or more elements in a new list.
 */
export function flatMap<A, B>(xs: A[], fn: (a: A) => B[]): B[] {
  return _.flatten(xs.map(fn), true);
}

/**
 * Run callbacks on key/value pairs which enter, exit or change between two objects.
 * enter() is called on new keys.
 * exit() is called on keys which are deleted.
 * update() is called on keys whose values change (according to '===').
 */
export function objectDiff<T>(
  oldObject: {[key: string]: T},
  newObject: {[key: string]: T},
  callbacks: {
    enter?: (newKey: string, newValue: T) => any;
    exit?: (oldKey: string, oldValue: T) => any;
    update?: (key: string, newValue: T, oldValue: T) => any;
  },
) {
  if (!oldObject) {
    // All keys are new
    if (callbacks.enter) {
      _.forEach(newObject, (value, key) => {
        if (callbacks.enter) {
          // TODO(danvk): remove after TS 2.3 update.
          callbacks.enter(key, value);
        }
      });
    }
    return;
  } else if (!newObject) {
    // All keys are deleted.
    if (callbacks.exit) {
      _.forEach(oldObject, (value, key) => {
        if (callbacks.exit) {
          // TODO(danvk): remove after TS 2.3 update.
          callbacks.exit(key, value);
        }
      });
    }
    return;
  }

  _.forEach(oldObject, (oldValue, key) => {
    if (key in newObject) {
      const newValue = newObject[key];
      if (oldValue !== newValue) {
        if (callbacks.update) callbacks.update(key, newValue, oldValue);
      }
    } else {
      if (callbacks.exit) callbacks.exit(key, oldValue);
    }
  });
  _.forEach(newObject, (v, k) => {
    if (!(k in oldObject)) {
      if (callbacks.enter) callbacks.enter(k, v);
    }
  });
}

/**
 * Convert an array to an object by assigning an ID to each of its values.
 * For string arrays, the function is optional.
 */
export function makeObject<T>(array: T[], idFunction: (val: T) => string): {[id: string]: T} {
  const o: {[id: string]: T} = {};
  array.forEach(value => {
    const id = idFunction(value);
    if (id in o) {
      throw new Error(`Duplicate key in utils.makeObject: ${id}`);
    }
    o[id] = value;
  });
  return o;
}

/**
 * Convert an array of strings to an object with "true" values, e.g. for fast lookups.
 */
export function makeLookup(array: string[]): {[id: string]: boolean} {
  const o: {[k: string]: boolean} = {};
  array.forEach(key => {
    o[key] = true;
  });
  return o;
}

/**
 * Do the two objects have the same keys and values?
 * This checks for equality using '==='. It does not do a deep comparison of values.
 */
export function shallowEqual<T>(a: T, b: T) {
  if (!!a !== !!b) return false; // they need to be either both be null or non-null.
  for (const k in a) {
    if (a[k] !== b[k]) {
      return false;
    }
  }
  for (const k in b) {
    if (!(k in a)) {
      return false;
    }
  }
  return true;
}

export function toQueryString(obj: {[key: string]: number | string}) {
  return _.map(
    obj,
    (value, key) => encodeURIComponent(key) + '=' + encodeURIComponent('' + value),
  ).join('&');
}

// Memoize a one-argument function.
export function memoize<K, V>(func: (key: K) => V): (key: K) => V {
  interface CacheRecord {
    key: K;
    value: V;
  }

  const cache: CacheRecord[] = [];
  return key => {
    const record = _.find(cache, {key});
    if (record) {
      return record.value;
    } else {
      const value = func(key);
      cache.push({key, value});
      return value;
    }
  };
}

/** Some handy type aliases. */
export type Feature = GeoJSON.Feature<GeoJSON.GeometryObject>;
export type FeatureCollection = GeoJSON.FeatureCollection<GeoJSON.GeometryObject>;

export function reversed<T>(list: T[]): T[] {
  const len = list.length;
  return list.map((value, i) => list[len - 1 - i]);
}

/** This is identical to _.zip(a, b), only better typed. */
export function zip<A, B>(a: A[], b: B[]): Array<[A, B]> {
  return _.zip(a, b) as Array<[A, B]>;
}

/** Builds url by encoding parameters. */
export function buildUrl(baseUrl: string, data: {[key: string]: any}) {
  const params: string[] = [];
  _.each(data, (value, key) => {
    if (data[key] === null) {
      return;
    }
    params.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
  });
  return `${baseUrl}?${params.join('&')}`;
}

/**
 * Removes leading indents from a template string without removing all leading whitespace.
 * Taken from tslint.
 */
export function dedent(strings: TemplateStringsArray, ...values: string[]) {
  let fullString = strings.reduce((accumulator, str, i) => accumulator + values[i - 1] + str);

  // match all leading spaces/tabs at the start of each line
  const match = fullString.match(/^[ \t]*(?=\S)/gm);
  if (!match) {
    // e.g. if the string is empty or all whitespace.
    return fullString;
  }

  // find the smallest indent, we don't want to remove all leading whitespace
  const indent = Math.min(...match.map(el => el.length));
  const regexp = new RegExp('^[ \\t]{' + indent + '}', 'gm');
  fullString = indent > 0 ? fullString.replace(regexp, '') : fullString;
  return fullString;
}

/** Assert that the object is not null. This is helpful with TypeScript's strictNullChecks. */
export function checkNonNull<T>(x: T | null): T {
  if (x === null) {
    throw new Error('Expected non-null but got null.');
  }
  return x;
}

/** Run a function in a new turn of the event loop, returning a Promise for its completion. */
export function defer(fn: () => any): Promise<any> {
  return new Promise((resolve, reject) => {
    setImmediate(async () => {
      try {
        resolve(await fn());
      } catch (e) {
        reject(e);
      }
    });
  });
}

function compareTuple<U>(as: U[], bs: U[]) {
  if (as.length !== bs.length) {
    throw new Error(`Incomparable tuples: ${as} vs. ${bs}`);
  }

  for (let i = 0; i < as.length; i++) {
    const a = as[i];
    const b = bs[i];
    if (a < b) return -1;
    if (a > b) return +1;
  }
  return 0;
}

/**
 * Sort an array using a key function that maps values to a tuple of ordered values.
 * The array is sorted by the first element in the tuples, then the second, etc.
 * This is a stable sort. If two values map to the same key, then their order will be preserved.
 *
 * This is kinda like values.sort(key=lambda value: (...)) in Python.
 *
 * Returns a (shallow) copy of the array.
 */
export function sortByTuple<T, U>(values: T[], keyFn: (value: T, index: number) => U[]): T[] {
  // Make N + 1 tuples where the first N are the key and the last is the index.
  // Sorting this gives us the correct order and a stable sort!
  const keyIndices = values.map((v, i) => [...keyFn(v, i), i]);
  keyIndices.sort(compareTuple);
  return keyIndices.map(keyIndex => values[(keyIndex as any)[keyIndex.length - 1]]);
}

/**
 * Await an object of promises, returning an object with the same keys but resolved values.
 *
 * This is similar to Promise.all(), but for objects.
 * It can be used as a workaround for https://github.com/Microsoft/TypeScript/issues/11924
 */
export async function promiseObject<T>(obj: {[k in keyof T]: Promise<T[k]>}): Promise<T> {
  const keys = Object.keys(obj);
  const promises = keys.map(k => (obj as any)[k]);
  const values = await Promise.all(promises);
  const out = {} as any;
  keys.forEach((k, i) => {
    out[k] = values[i];
  });
  return out;
}
