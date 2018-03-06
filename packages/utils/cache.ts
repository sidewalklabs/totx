import * as stringify from 'json-stable-stringify';
import * as _ from 'underscore';

export interface CacheOptions<K, V> {
  /** Get the value for a key, e.g. by requesting it from the network. */
  fetch: (key: K) => Promise<V>;

  /**
   * Convert the cache key to a string for indexing.
   * If stringify(a) == stringify(b), then it should also be true that fetch(a) == fetch(b).
   * The default is an order-insensitive JSON stringify.
   * You must implement this if your keys aren't JSON serializable.
   */
  stringify?: (key: K) => string;
}

/**
 * A general cache for a remote resource.
 *
 * Once a remote resource is fetched, it will always be available in the cache.
 * (It will never be evicted.)
 */
export default class Cache<K, V> {
  private cache: {
    [key: string]: {
      value: V;
      lastTimeMs: number;
    };
  } = {};

  // These are fetches that are in-progress.
  // This is used to merge a second fetch for a key before the first returns.
  private pendingFetches: {
    [key: string]: Promise<V>;
  } = {};

  private fetch: (key: K) => Promise<V>;
  private stringify: (key: K) => string;

  public numFetches = 0;

  constructor(options: CacheOptions<K, V>) {
    this.fetch = (key: K) => {
      this.numFetches++;
      return options.fetch(key);
    };
    this.stringify = options.stringify || stringify;
  }

  /**
   * Get the value for a key, either from cache or from the network.
   */
  public get(key: K): Promise<V> {
    const stringKey = this.stringify(key);
    if (stringKey in this.cache) {
      return Promise.resolve(this.getFromCacheString(stringKey));
    }

    if (this.pendingFetches[stringKey]) {
      return this.pendingFetches[stringKey];
    }

    const promisedValue = this.fetch(key)
      .then(value => {
        this.cache[stringKey] = {
          value,
          lastTimeMs: new Date().getTime(),
        };
        delete this.pendingFetches[stringKey];
        return value;
      })
      .catch(err => {
        delete this.pendingFetches[stringKey];
        return Promise.reject(err);
      });

    this.pendingFetches[stringKey] = promisedValue;
    return promisedValue;
  }

  /**
   * Retrieve a value from local cache or return null if it's not available.
   * This will never hit the network.
   */
  public getFromCache(key: K): (V | null) {
    return this.getFromCacheString(this.stringify(key));
  }

  /** Dump the cache's contents to a structure that can be passed to load(). */
  public dump(): {[key: string]: V} {
    return _.mapObject(this.cache, v => v.value);
  }

  /** Load dumped data into the cache. */
  public load(contents: {[key: string]: V}) {
    const lastTimeMs = Date.now();
    this.cache = _.mapObject(contents, v => ({
      lastTimeMs,
      value: v,
    }));
  }

  /**
   * How many network fetches are in flight right now?
   */
  public numPendingFetches(): number {
    return Object.keys(this.pendingFetches).length;
  }

  private getFromCacheString(stringKey: string): V | null {
    if (stringKey in this.cache) {
      const record = this.cache[stringKey];
      record.lastTimeMs = new Date().getTime();
      return record.value;
    }
    return null;
  }
}
