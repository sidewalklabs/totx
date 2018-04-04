import * as React from 'react';

import {Marker} from 'react-mapbox-gl';
import {LatLng} from '../../coordinates';

export interface MarkerProps {
  /** The (lat, lng) position at which to show the marker. */
  position: LatLng;

  draggable?: boolean;

  icon?: string; // Path to a marker image URL. Default is a red pin.

  /** Fired when the user drops the marker in a new location. */
  onDragEnd?: (newPosition: LatLng) => void;
}

export class MapboxMarker extends React.Component<MarkerProps, {}> {
  render() {
    const {position, icon} = this.props;
    return (
      <Marker coordinates={[position.lng, position.lat]} anchor="bottom">
        <img src={icon} />
      </Marker>
    );
  }
}
