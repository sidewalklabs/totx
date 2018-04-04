import * as _ from 'underscore';

import 'whatwg-fetch';

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

/**
 * Map each element of a list to zero, one or more elements in a new list.
 */
export function flatMap<A, B>(xs: A[], fn: (a: A) => B[]): B[] {
  return _.flatten(xs.map(fn), true);
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
