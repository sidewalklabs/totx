import * as React from 'react';
import {Feature, Layer} from 'react-mapbox-gl';

import {LatLng} from './latlng';

export interface MarkerProps {
  /** The (lat, lng) position at which to show the marker. */
  position: LatLng;
  draggable?: boolean;
  icon: string; // Symbol name in Mapbox style.
  iconAnchor?: string; // e.g. 'center' or 'bottom'.

  id?: string;

  onDragStart?: () => any;

  /** Fired when the user drops the marker in a new location. */
  onDragEnd?: (newPosition: LatLng) => any;
}

export class MapboxMarker extends React.Component<MarkerProps, {}> {
  constructor(props: MarkerProps) {
    super(props);

    this.onDragEnd = this.onDragEnd.bind(this);
    this.onDragStart = this.onDragStart.bind(this);
  }

  render() {
    const {draggable, id, position} = this.props;
    const layout = {
      'icon-image': this.props.icon,
      'icon-anchor': this.props.iconAnchor || 'bottom',
    };
    return (
      <Layer type="symbol" layout={layout} id={id}>
        <Feature
          coordinates={[position.lng, position.lat]}
          draggable={draggable}
          onDragStart={this.onDragStart}
          onDragEnd={this.onDragEnd}
          properties={{marker: true}}
        />
      </Layer>
    );
  }

  onDragStart(e: any) {
    if (this.props.onDragStart) {
      this.props.onDragStart();
    }
  }

  onDragEnd(e: any) {
    if (this.props.onDragEnd) {
      this.props.onDragEnd(e.lngLat);
    }
  }
}
