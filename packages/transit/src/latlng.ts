// Functions and types for dealing with coordinate systems.

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

  toString(): string {
    return `${this.lat}, ${this.lng}`;
  }
}

/** A center and zoom level -- used to set the Google Maps viewport. */
export interface CenterZoomLevel {
  center: LatLng;
  zoomLevel: number;
}
