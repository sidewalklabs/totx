import * as React from 'react';
import ReactMapboxGl, {
  RotationControl,
  ScaleControl,
  ZoomControl,
  Layer,
  Feature,
} from 'react-mapbox-gl';
import {GeoJSONLayer} from 'react-mapbox-gl';

import {CenterZoomLevel, LatLng} from '../../coordinates';
import {StyledFeatureData, BoxPlusLevel} from '../../overlaymap';
import {Feature as GeoJSONFeature} from '../../utils';

import {ChoroplethLayer} from './choropleth-layer';
import {MapboxMarker} from './mapbox-marker';

export interface Props {
  view: CenterZoomLevel;
  data: StyledFeatureData[];
  onLoad?: () => void;
  onError: (error: Error) => void;

  onClick?: (point: LatLng) => void;

  // TODO(danvk): eliminate this in favor of a ref.
  onBoundsChanged?: (bounds: BoxPlusLevel) => void;

  children?: any; // TODO(danvk): refine
}

interface State {}

// TODO(danvk): load this via an environment variable.
const MapboxGL = ReactMapboxGl({
  accessToken:
    'pk.eyJ1IjoiZGFudmsiLCJhIjoiY2lrZzJvNDR0MDBhNXR4a2xqNnlsbWx3ciJ9.myJhweYd_hrXClbKk8XLgQ',
});

export class Map extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.onClick = this.onClick.bind(this);
  }

  render() {
    const center = this.props.view.center;
    const data = this.props.data[0];
    return (
      <MapboxGL
        center={[center.lng, center.lat]}
        containerStyle={{flex: '1'}}
        style={'mapbox://styles/kevgrenn/cj907tt8x0q4v2sqmrebamelo'}
        onStyleLoad={this.props.onLoad}
        onClick={this.onClick}>
        <ChoroplethLayer
          geojson={data.geojson}
          styleFn={data.styleFn}
          visibility="visible"
          before="poi-small"
        />
        {this.props.children}
      </MapboxGL>
    );
  }

  onClick(map: mapboxgl.Map, event: React.SyntheticEvent<any>) {
    if (this.props.onClick) {
      this.props.onClick((event as any).lngLat);
    }
  }
}
