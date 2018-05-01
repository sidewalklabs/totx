import * as _ from 'underscore';

import 'whatwg-fetch';

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

/**
 * Returns a version of the function that returns the same value if it's repeatedly called with the
 * same arguments (according to shallowEquals). This only remembers the last invocation.
 * Useful for React components.
 */
export function memoizeLast<T, U>(fn: (args: T) => U): ((args: T) => U) {
  let lastArgs: T;
  let lastResult: U;

  return (args: T) => {
    if (args === lastArgs || shallowEqual(args, lastArgs)) {
      return lastResult;
    }
    lastArgs = args;
    lastResult = fn(args);
    return lastResult;
  };
}

export function makeObject<T>(keys: string[], valueFn: (key: string) => T): {[key: string]: T} {
  const out: {[key: string]: T} = {};
  for (const k of keys) {
    out[k] = valueFn(k);
  }
  return out;
}
