declare module 'topojson-client' {
  /**
   * Returns the GeoJSON Feature or FeatureCollection for the specified object in the given
   * topology. If the specified object is a GeometryCollection, a FeatureCollection is returned,
   * and each geometry in the collection is mapped to a Feature. Otherwise, a Feature is returned.
   */
  export function feature(topology: any, object: any): any;
}
