import {BoundingBox, GooglePoint} from '../coordinates';
import {shallowEqual} from './index';

interface GeoFetcherOptions<K, V> {
  /**
   * A function to use when we want to fetch data. If this function returns 'null' instead
   * of a value, this implies that we want to skip this request (for instance, because the desired
   * bounding box is too large). In this case, we will re-fetch whenever the bounding box or key
   * changes by any amount.
   */
  fetch: (bbox: BoundingBox<GooglePoint>, key: K | null) => Promise<V | null>;

  /** A function to be called when we have fetched any data. */
  onFetch: (value: V | null) => any;

  /** A function to be called when fetching returns an error. */
  onError?: (error: Error) => any;

  /**
   * Each dimension of the fetched bounding box will be this many times the size of the requested
   * bounding box. Defaults to 1.5.
   */
  expansionFactor?: number;
}

/**
 * GeoFetcher manages fetches of geographically-bounded data that should follow a map. Because
 * map bounds can change a little bit at a time, we don't want to always re-fetch whenever the
 * map changes. Instead, we fetch a bit wider of an area than requested and only re-fetch when
 * the requested area is outside this expanded region. We also re-fetch whenever any of a set
 * of keys changes (they are shallow-compared for equality).
 */
export default class GeoFetcher<K, V> {
  /** Is there a request in flight right now? */
  private requestInProgress: boolean = false;

  /** Did fetch tell us to skip calling the server last time? */
  private skippedFetch: boolean = true;

  /** The last key for which onFetch was called. */
  private lastKey: K | null = null;

  /** The last bounding box for which onFetch was called. */
  private lastBBox: BoundingBox<GooglePoint> | null = null;

  /** The key that was set most recently. */
  private key: K | null = null;

  /** The bounding box that was set most recently. */
  private bbox: BoundingBox<GooglePoint> | null = null;

  /** Construct a GeoFetcher. */
  constructor(private options: GeoFetcherOptions<K, V>) {
    if (!this.options.expansionFactor) {
      this.options.expansionFactor = 1.5;
    }
  }

  /** Set the bounds requested, keeping existing keys. */
  setBounds(bbox: BoundingBox<GooglePoint>) {
    this.bbox = bbox;
    this.skippedFetch = false;
    this.maybeFetch();
  }

  /** Set the keys requested, keeping existing bounds. */
  setKey(key: K) {
    this.key = key;
    this.skippedFetch = false;
    this.maybeFetch();
  }

  /** Set the bounds and keys requested. */
  setBoundsAndKey(bbox: BoundingBox<GooglePoint>, key: K) {
    this.bbox = bbox;
    this.key = key;
    this.skippedFetch = false;
    this.maybeFetch();
  }

  private shouldFetch(): boolean {
    if (!this.bbox || this.skippedFetch) {
      return false;
    }
    if (
      shallowEqual(this.key, this.lastKey) &&
      this.lastBBox &&
      this.bbox.isWithin(this.lastBBox)
    ) {
      return false;
    }
    return true;
  }

  private async maybeFetch() {
    if (this.requestInProgress) {
      return;
    }
    this.requestInProgress = true;
    while (this.shouldFetch()) {
      this.lastKey = this.key;
      this.lastBBox = this.bbox.expandByFactor(this.options.expansionFactor);
      try {
        const v = await this.options.fetch(this.lastBBox, this.lastKey);
        this.options.onFetch(v);
        if (v === null) {
          this.lastBBox = null;
          this.skippedFetch = true;
        }
      } catch (e) {
        if (this.options.onError) {
          this.options.onError(e);
        }
      }
    }
    this.requestInProgress = false;
  }
}
