import * as React from 'react';
import ReactMapboxGl, {ZoomControl} from 'react-mapbox-gl';

import {CenterZoomLevel, LatLng} from './latlng';
import {StyledFeatureData} from './stylefn';

import {ChoroplethLayer} from './choropleth-layer';
import {RouteLayer} from './route-layer';
import {memoize} from '../../utils';

export interface Props {
  view: CenterZoomLevel;
  data: StyledFeatureData;
  routes: StyledFeatureData[];
  onLoad?: () => void;
  onError: (error: Error) => void;
  onClick?: (point: LatLng) => void;
  children?: any; // TODO(danvk): refine
}

interface State {
  center: [number, number];
  zoom: [number];
}

// TODO(danvk): load this via an environment variable.
const MapboxGL = ReactMapboxGl({
  accessToken:
    'pk.eyJ1IjoiZGFudmsiLCJhIjoiY2lrZzJvNDR0MDBhNXR4a2xqNnlsbWx3ciJ9.myJhweYd_hrXClbKk8XLgQ',
});

function viewToState(view: CenterZoomLevel): State {
  return {
    center: [view.center.lng, view.center.lat],
    zoom: [view.zoomLevel],
  };
}

export class Map extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = viewToState(props.view);
    this.onClick = this.onClick.bind(this);
    this.onZoomEnd = this.onZoomEnd.bind(this);
  }

  render() {
    const {center, zoom} = this.state;
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
        center={center}
        zoom={zoom}
        containerStyle={{flex: '1'}}
        style={'mapbox://styles/danvk/cjg3tbb346bbk2sps9pzy6f99'}
        onStyleLoad={this.props.onLoad}
        onZoomEnd={this.onZoomEnd}
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

  componentWillReceiveProps(nextProps: Readonly<Props>) {
    const {view} = nextProps;
    if (view !== this.props.view) {
      this.setState(viewToState(view));
    }
  }

  onZoomEnd(map: mapboxgl.Map) {
    const {lng, lat} = map.getCenter();
    const zoom = map.getZoom();
    this.setState({
      center: [lng, lat],
      zoom: [zoom],
    });
  }
}
