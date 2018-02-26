// Functions and types for dealing with coordinate systems.

import * as _ from 'underscore';

// Radius of the earth in meters.
const EPSG3857_RADIUS = 6378137;

// EPSG 3857 is the same projection as Google Maps, but its units are this many times larger. Also,
// the Y axis is reversed, and the origin is arranged so that coordinates are always positive.
const EPSG3857_FACTOR = EPSG3857_RADIUS * Math.PI / 128;

/** A coordinate as represented in GeoJSON. 'X' comes before 'Y'. */
export type GeoJSONPoint = [number, number];

/** An arbitrary x, y coordinate system. */
export abstract class XY {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  abstract convertTo<T>(cls: ConstructorOf<T>): T;

  toGeoJSON(): GeoJSONPoint {
    return [this.x, this.y];
  }
}

/** Type of the constructor of XY subtypes -- used below. */
export interface PointClass<T extends XY> {
  new (x: number, y: number): T;
}

/** A lat, lng pair. Note that unlike with XY, latitude comes first! */
export class LatLng {
  type(): 'latlng' {
    return 'latlng';
  }

  lat: number;
  lng: number;

  constructor(lat: number, lng: number) {
    this.lat = lat;
    this.lng = lng;
  }

  static fromGeoJSON(p: GeoJSONPoint): LatLng {
    return new LatLng(p[1], p[0]);
  }

  /**
   * Convert to another coordinate system.
   * e.g., new LatLng(...).convertTo(GooglePoint) will return a point in Google projection
   * coordinates.
   */
  convertTo<T extends XY>(cls: PointClass<T>): T {
    if ((cls as any) === Epsg3857Point) {
      return new cls(
        this.lng * (EPSG3857_RADIUS * Math.PI) / 180,
        Math.log(Math.tan((this.lat + 90) * Math.PI / 360)) * EPSG3857_RADIUS,
      );
    } else if ((cls as any) === GooglePoint) {
      return this.convertTo(Epsg3857Point).convertTo(GooglePoint) as any;
    } else {
      throw new Error('Unsupported type: ' + cls);
    }
  }

  /**
   * Get the compass heading in degrees from one lat/lng point to another. (Technically, this gets
   * the *initial* heading along the great circle between the points, but if the points are pretty
   * close, we can just call this the heading.)
   * Taken from http://www.movable-type.co.uk/scripts/latlong.html
   */
  headingTo(to: LatLng): number {
    const srcLatRadians = this.lat * Math.PI / 180;
    const destLatRadians = to.lat * Math.PI / 180;
    const deltaLngRadians = (to.lng - this.lng) * Math.PI / 180;

    const y = Math.sin(deltaLngRadians) * Math.cos(destLatRadians);
    const x =
      Math.cos(srcLatRadians) * Math.sin(destLatRadians) -
      Math.sin(srcLatRadians) * Math.cos(destLatRadians) * Math.cos(deltaLngRadians);
    return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
  }

  toGeoJSON(): GeoJSONPoint {
    return [this.lng, this.lat];
  }

  toString(): string {
    return `${this.lat}, ${this.lng}`;
  }
}

export interface ConstructorOf<T> {
  new (...args: any[]): T;
}

/** A coordinate as represented in EPSG 3857 projection coordinates. */
export class Epsg3857Point extends XY {
  type(): 'epsg' {
    return 'epsg';
  }

  static fromGeoJSON(p: GeoJSONPoint): Epsg3857Point {
    return new Epsg3857Point(p[0], p[1]);
  }

  convertTo<T>(cls: ConstructorOf<T>): T {
    if ((cls as any) === GooglePoint) {
      return new cls(128 + this.x / EPSG3857_FACTOR, 128 - this.y / EPSG3857_FACTOR);
    } else if ((cls as any) === LatLng) {
      return new cls(
        360 * Math.atan(Math.exp(this.y / EPSG3857_RADIUS)) / Math.PI - 90,
        180 * this.x / (EPSG3857_RADIUS * Math.PI),
      );
    } else {
      throw new Error('Unsupported type: ' + cls);
    }
  }

  // Get the length of a meter near this point in projection coordinates.
  meterLength(): number {
    return 1 / Math.cosh(this.y / EPSG3857_RADIUS);
  }
}

/**
 * A coordinate as represented in Google Maps' projection coordinate system.
 * This is a version of EPSG 3857 that has been  scaled and translated so that Y coordinates
 * increase from North to South, and so that both X and Y coordinates are in the range [0, 256].
 */
export class GooglePoint extends XY {
  type(): 'google' {
    return 'google';
  }

  static fromGeoJSON(p: GeoJSONPoint): GooglePoint {
    return new GooglePoint(p[0], p[1]);
  }

  convertTo<T>(cls: ConstructorOf<T>): T {
    if ((cls as any) === Epsg3857Point) {
      return new cls((this.x - 128) * EPSG3857_FACTOR, (128 - this.y) * EPSG3857_FACTOR);
    } else if ((cls as any) === LatLng) {
      return this.convertTo(Epsg3857Point).convertTo(LatLng) as any;
    } else {
      throw new Error('Unsupported type: ' + cls);
    }
  }

  toPixel(scale: number, topLeft: GooglePoint): {x: number; y: number} {
    return {x: (this.x - topLeft.x) * scale, y: (this.y - topLeft.y) * scale};
  }

  // Get the length of a meter near this point in projection coordinates.
  meterLength(): number {
    return this.convertTo(Epsg3857Point).meterLength() / EPSG3857_FACTOR;
  }
}

/** A bounding box without a specific coordinate system. */
export interface BaseBoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/** A center and zoom level -- used to set the Google Maps viewport. */
export interface CenterZoomLevel {
  center: LatLng;
  zoomLevel: number;
}

/** A bounding box in a specific coordinate system. */
export class BoundingBox<T extends XY> {
  pointType: PointClass<T>;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;

  constructor(pointType: PointClass<T>, minX: number, minY: number, maxX: number, maxY: number) {
    this.pointType = pointType;
    this.minX = minX;
    this.maxX = maxX;
    this.minY = minY;
    this.maxY = maxY;
  }

  /** Construct a bounding box from a BaseBoundingBox and a coordinate system. */
  static from<T extends XY>(pointType: PointClass<T>, bbox: BaseBoundingBox): BoundingBox<T> {
    return new BoundingBox<T>(
      pointType,
      parseFloat(bbox.minX as any),
      parseFloat(bbox.minY as any),
      parseFloat(bbox.maxX as any),
      parseFloat(bbox.maxY as any),
    );
  }

  /** Construct a bounding box given the points at two of its corners. */
  static fromPoints<T extends XY>(p1: T, p2: T): BoundingBox<T> {
    return new BoundingBox<T>(
      (p1.constructor as any) as PointClass<T>,
      Math.min(p1.x, p2.x),
      Math.min(p1.y, p2.y),
      Math.max(p1.x, p2.x),
      Math.max(p1.y, p2.y),
    );
  }

  /** Convert the bounding box to a different coordinate system. */
  convertTo<U extends XY>(pointType: PointClass<U>): BoundingBox<U> {
    return BoundingBox.fromPoints<U>(
      new this.pointType(this.minX, this.minY).convertTo(pointType),
      new this.pointType(this.maxX, this.maxY).convertTo(pointType),
    );
  }

  /** Is this bounding box within other? */
  isWithin(other: BoundingBox<T>): boolean {
    return (
      this.minX >= other.minX &&
      this.maxX <= other.maxX &&
      this.minY >= other.minY &&
      this.maxY <= other.maxY
    );
  }

  /** Does this bounding box contain the supplied point? */
  containsPoint(point: T): boolean {
    return (
      this.minX <= point.x && this.maxX >= point.x && this.minY <= point.y && this.maxY >= point.y
    );
  }

  /** Do these two bounding boxes overlap? */
  overlaps(other: BoundingBox<T>): boolean {
    return (
      doRangesOverlap([this.minX, this.maxX], [other.minX, other.maxX]) &&
      doRangesOverlap([this.minY, this.maxY], [other.minY, other.maxY])
    );
  }

  /** The area of bounding box, in projection coordinates. */
  area(): number {
    return (this.maxX - this.minX) * (this.maxY - this.minY);
  }

  /** The center of the bounding box. */
  center(): T {
    return new this.pointType((this.minX + this.maxX) / 2, (this.minY + this.maxY) / 2);
  }

  /**
   * Get the center of this box (as a lat/lng pair) and the zoom level that would be needed to
   * show the whole bounding box in a 1024px by 1024px Google map.
   */
  toCenterLevel(): CenterZoomLevel {
    const width = this.maxX - this.minX;
    const height = this.maxY - this.minY;
    const center = this.center().convertTo(LatLng);
    const zoomLevel = Math.round(
      Math.max(Math.log(1024 / width), Math.log(1024 / height)) / Math.LN2,
    );
    return {center, zoomLevel};
  }

  /**
   * Return a bounding box whose width and height are both multiplied by this factor.
   * For instance, a factor of 2 will result in a box that is twice as high and twice as wide.
   */
  expandByFactor(factor: number): BoundingBox<T> {
    const deltaWidth = (this.maxX - this.minX) * (factor - 1) / 2;
    const deltaHeight = (this.maxY - this.minY) * (factor - 1) / 2;

    return new BoundingBox<T>(
      this.pointType,
      this.minX - deltaWidth,
      this.minY - deltaHeight,
      this.maxX + deltaWidth,
      this.maxY + deltaHeight,
    );
  }

  /** Return a bounding box that fully covers a GeoJSON feature. */
  static fromFeature<T extends XY>(
    feature: GeoJSON.Feature<GeoJSON.GeometryObject>,
    pointType: PointClass<T>,
  ): BoundingBox<T> {
    return BoundingBox.from(pointType, boundsForCoordinates(feature.geometry.coordinates));
  }

  /** Return a bounding box that fully covers all features in a GeoJSON collection. */
  static fromFeatureCollection<T extends XY>(
    featureCollection: GeoJSON.FeatureCollection<GeoJSON.GeometryObject>,
    pointType: PointClass<T>,
  ): BoundingBox<T> {
    return BoundingBox.from(
      pointType,
      _.reduce(
        featureCollection.features.map(feature =>
          boundsForCoordinates(feature.geometry.coordinates),
        ),
        unionOfBounds,
      ),
    );
  }
}

/** Do the supplied numerical ranges overlap each other? Exported for testing. */
export function doRangesOverlap(a: [number, number], b: [number, number]): boolean {
  return a[0] <= b[1] && b[0] <= a[1];
}

/** Return a bounding box which contains each of the arguments. */
function unionOfBounds(a: BaseBoundingBox, b: BaseBoundingBox): BaseBoundingBox {
  return {
    minX: Math.min(a.minX, b.minX),
    minY: Math.min(a.minY, b.minY),
    maxX: Math.max(a.maxX, b.maxX),
    maxY: Math.max(a.maxY, b.maxY),
  };
}

/**
 * Return a bounding box for a coordinate ring of any dimension.
 * (We don't do this via the BoundingBox object because it is performance-sensitive.)
 */
function boundsForCoordinates(coordinates: any[]): BaseBoundingBox {
  if (coordinates.length === 0) {
    throw new Error('Tried to get bounds of empty coordinate array.');
  }

  if (_.isNumber(coordinates[0])) {
    // Must be an individual coordinate.
    return {
      minX: coordinates[0],
      maxX: coordinates[0],
      minY: coordinates[1],
      maxY: coordinates[1],
    };
  }

  // Check if it's an array of 2-element arrays.
  // This is purely an optimization to avoid construction of extra BoundingBox objects.
  if (_.isNumber(coordinates[0][0])) {
    let minX = coordinates[0][0];
    let maxX = minX;
    let minY = coordinates[0][1];
    let maxY = minY;

    for (let i = 1; i < coordinates.length; i++) {
      const [x, y] = coordinates[i];
      if (x < minX) {
        minX = x;
      } else if (x > maxX) {
        maxX = x;
      }
      if (y < minY) {
        minY = y;
      } else if (y > maxY) {
        maxY = y;
      }
    }

    return {
      minX,
      minY,
      maxX,
      maxY,
    };
  }

  // It must be a more complex shape. Break it down recursively.
  return _.reduce(coordinates.map(boundsForCoordinates), unionOfBounds);
}

/**
 * Transform a GeoJSON geometry from EPSG 3857 to Google's projection coordinate system.
 * Since they use the same projection, this is a simple linear transformation.
 * We don't do it via the Point objects above because this is performance-sensitive.
 */
export function transformGeometryEpsg3857ToGoogle(
  geometry: GeoJSON.GeometryObject,
): GeoJSON.GeometryObject {
  const transformCoords = (coords: any[]): any[] => {
    if (coords.length === 0) {
      return coords;
    } else if (!coords[0].length) {
      return [128 + coords[0] / EPSG3857_FACTOR, 128 - coords[1] / EPSG3857_FACTOR];
    } else {
      return coords.map(transformCoords);
    }
  };
  return {
    type: geometry.type,
    coordinates: transformCoords(geometry.coordinates),
  };
}

/**
 * Transform a latitude/longitude geometry to Google.
 */
export function transformGeometryLatLngToGoogle(
  geometry: GeoJSON.GeometryObject,
): GeoJSON.GeometryObject {
  const transformCoords = (coords: any[]): any[] => {
    if (coords.length === 0) {
      return coords;
    } else if (!coords[0].length) {
      return new LatLng(coords[1], coords[0]).convertTo(GooglePoint).toGeoJSON();
    } else {
      return coords.map(transformCoords);
    }
  };
  return {
    type: geometry.type,
    coordinates: transformCoords(geometry.coordinates),
  };
}

/**
 * Compute the distance (in meters) between two points on the earth's surface.
 * See https://en.wikipedia.org/wiki/Haversine_formula
 */
export function distanceMeters(start: LatLng, end: LatLng) {
  const lat1 = start.lat * Math.PI / 180;
  const lng1 = start.lng * Math.PI / 180;
  const lat2 = end.lat * Math.PI / 180;
  const lng2 = end.lng * Math.PI / 180;
  const dLat = lat2 - lat1;
  const dLng = lng2 - lng1;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EPSG3857_RADIUS * c;
}
