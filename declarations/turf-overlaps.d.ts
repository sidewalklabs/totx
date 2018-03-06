declare namespace turfOverlaps {
  interface ITurfOverlaps {
    (a: GeoJSON.Feature<GeoJSON.GeometryObject>,
     b: GeoJSON.Feature<GeoJSON.GeometryObject>): boolean;
  }
}

declare module 'turf-overlaps' {
  const overlap: turfOverlaps.ITurfOverlaps;
  export = overlap;
}
