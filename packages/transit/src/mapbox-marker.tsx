import * as React from 'react';
import {Feature, Layer} from 'react-mapbox-gl';

import {LatLng} from './latlng';

export interface MarkerProps {
  /** The (lat, lng) position at which to show the marker. */
  position: LatLng;
  draggable?: boolean;
  icon: string; // Symbol name in Mapbox style.
  iconAnchor?: string; // e.g. 'center' or 'bottom'.

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
    const layout = {
      'icon-image': this.props.icon,
      'icon-anchor': this.props.iconAnchor || 'bottom',
    };
    return (
      <Layer type="symbol" layout={layout}>
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
