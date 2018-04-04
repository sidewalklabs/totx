import * as React from 'react';
import {Feature, Layer} from 'react-mapbox-gl';

import {LatLng} from './latlng';

export interface MarkerProps {
  /** The (lat, lng) position at which to show the marker. */
  position: LatLng;
  draggable?: boolean;
  icon?: string; // Path to a marker image URL. Default is a red pin.

  /** Fired when the user drops the marker in a new location. */
  onDragEnd?: (newPosition: LatLng) => void;
}

export class MapboxMarker extends React.Component<MarkerProps, {}> {
  constructor(props: MarkerProps) {
    super(props);

    this.onDragEnd = this.onDragEnd.bind(this);
  }

  render() {
    const {draggable, position} = this.props;
    // TODO(danvk): figure out how to set a custom icon.
    return (
      <Layer type="circle" paint={{'circle-radius': 8}}>
        <Feature
          coordinates={[position.lng, position.lat]}
          draggable={draggable}
          onDragEnd={this.onDragEnd}
        />
      </Layer>
    );
  }

  onDragEnd(e: any) {
    if (this.props.onDragEnd) {
      this.props.onDragEnd(e.lngLat);
    }
  }
}
