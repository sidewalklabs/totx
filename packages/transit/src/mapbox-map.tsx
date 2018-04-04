import * as React from 'react';
import ReactMapboxGl, {ZoomControl} from 'react-mapbox-gl';

import {StyledFeatureData} from '../../overlaymap';
import {CenterZoomLevel, LatLng} from './latlng';

import {ChoroplethLayer} from './choropleth-layer';
import {RouteLayer} from './route-layer';

export interface Props {
  view: CenterZoomLevel;
  data: StyledFeatureData;
  routes: StyledFeatureData[];
  onLoad?: () => void;
  onError: (error: Error) => void;

  onClick?: (point: LatLng) => void;

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
    const {data, routes} = this.props;

    const routesEls = routes.map((r, i) => (
      <RouteLayer
        geojson={r.geojson}
        styleFn={r.styleFn}
        visibility={'visible'}
        before={'poi-small'}
        key={`route${i}`}
      />
    ));

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
        {routesEls}
        {this.props.children}
        <ZoomControl position="bottom-right" />
      </MapboxGL>
    );
  }

  onClick(map: mapboxgl.Map, event: React.SyntheticEvent<any>) {
    if (this.props.onClick) {
      this.props.onClick((event as any).lngLat);
    }
  }
}
