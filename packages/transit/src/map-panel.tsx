import {LngLat} from 'mapbox-gl';
import * as React from 'react';
import {Popup} from 'react-mapbox-gl';

import {memoizeLast, Feature, FeatureCollection} from '../../utils';
import Action from './action';
import Colors from './colors';
import {State as DataStoreState} from './datastore';
import {LatLng} from './latlng';
import {Map} from './mapbox-map';
import {MapboxMarker} from './mapbox-marker';
import * as ramps from './ramps';

type ViewProps = DataStoreState & {
  handleAction: (action: Action) => any;
};

interface State {
  hover: {
    coordinates: [number, number]; // lng, lat
    minutes: number;
    minutes2?: number;
  } | null;
}

function isDefined(x: number) {
  return x !== null && x !== undefined;
}

function makeStyleFn(args: Pick<ViewProps, 'mode' | 'times' | 'times2'>) {
  const {mode, times, times2} = args;
  if (mode === 'single') {
    return (feature: any) => {
      const id = feature.properties['geo_id'];
      const secs = times[id];
      return isDefined(secs) ? ramps.SINGLE(secs) : Colors.clear;
    };
  }

  const secsOrBig = (secs: number) => (!isDefined(secs) ? 10000 : secs);
  const ramp = mode === 'compare-origin' ? ramps.ORIGIN_COMPARISON : ramps.SETTINGS_COMPARISON;
  return (feature: any) => {
    const id = feature.properties['geo_id'];
    const secs1 = times[id];
    const secs2 = times2[id];
    return isDefined(secs1) || isDefined(secs2)
      ? ramp(secsOrBig(secs1) - secsOrBig(secs2))
      : Colors.clear;
  };
}

const getStyleFn = memoizeLast(makeStyleFn);

/**
 * This component muxes between the data store and the generic Google Maps component.
 */
export default class Root extends React.Component<ViewProps, State> {
  private onLoad: (map: mapboxgl.Map) => any;
  private onError: (error: Error) => void;

  constructor(props: ViewProps) {
    super(props);
    this.onLoad = map => {
      const mapboxCanvas = map.getCanvas();
      let wasHovering = false;
      mapboxCanvas.addEventListener('mousemove', e => {
        const {clientX, clientY} = e;
        const pt = [clientX, clientY];
        const features = map.queryRenderedFeatures(pt);

        let marker = false;

        const markerPoint = map.project([this.props.origin.lng, this.props.origin.lat]);
        const dPx2 = Math.pow(markerPoint.x - pt[0], 2) + Math.pow(markerPoint.y - pt[1], 2);
        if (dPx2 < 30 * 30) {
          marker = true;
        }

        let hoverFeature: typeof features[0];
        for (const feature of features) {
          // NB: the geo_id check is a hack
          if (feature.properties && feature.properties.geo_id) {
            hoverFeature = feature;
          }
        }

        if (marker) {
          if (wasHovering) {
            this.handleChoroplethLeave(map);
            wasHovering = false;
          }
        } else if (hoverFeature) {
          const lngLat = map.unproject(pt);
          this.handleChoroplethHover(hoverFeature, lngLat, map);
          wasHovering = true;
        } else {
          if (wasHovering) {
            this.handleChoroplethLeave(map);
            wasHovering = false;
          }
        }
      });
      this.props.handleAction({type: 'map-ready'});
    };

    this.onError = error => this.props.handleAction({type: 'report-error', error});
    this.onClick = this.onClick.bind(this);
    this.handleDestinationMove = this.handleDestinationMove.bind(this);
    this.handleChoroplethHover = this.handleChoroplethHover.bind(this);
    this.handleChoroplethLeave = this.handleChoroplethLeave.bind(this);

    this.state = {
      hover: null,
    };
  }

  render() {
    const routes: FeatureCollection[] = [];
    if (this.props.routes) {
      for (const route of this.props.routes) {
        if (!route) continue;
        routes.push(route.geojson);
      }
    }

    // Compare origins mode has A/B pins. Other modes have a single, blank pin.
    let firstMarkerImage = 'blue-marker';
    let secondMarker: JSX.Element = null;
    if (this.props.mode === 'compare-origin') {
      firstMarkerImage = 'blue-marker';
      secondMarker = (
        <MapboxMarker
          position={this.props.origin2}
          draggable={true}
          icon="blue-marker"
          onDragEnd={loc => this.handleMarkerMove(true, loc)}
        />
      );
    }

    let destinationMarker: JSX.Element = null;
    if (this.props.destination) {
      destinationMarker = (
        <MapboxMarker
          position={this.props.destination}
          draggable={true}
          icon="measle"
          iconAnchor="center"
          onDragEnd={this.handleDestinationMove}
        />
      );
    }

    let popup: JSX.Element = null;
    let ghostMarker: JSX.Element = null;
    const {hover} = this.state;
    if (hover) {
      popup = (
        <Popup coordinates={hover.coordinates}>
          {hover.minutes2 ? (
            <div className={'secondary ' + this.props.mode}>{hover.minutes2} min</div>
          ) : null}
          <div className="primary">{hover.minutes} min</div>
        </Popup>
      );
      const [lng, lat] = hover.coordinates;
      const position = new LatLng(lat, lng);
      ghostMarker = <MapboxMarker position={position} icon="measle" iconAnchor="center" />;
    }

    return (
      <Map
        view={this.props.view}
        geojson={this.props.geojson}
        styleFn={getStyleFn(this.props)}
        routes={routes}
        onLoad={this.onLoad}
        onClick={this.onClick}
        onChoroplethHover={this.handleChoroplethHover}
        onChoroplethLeave={this.handleChoroplethLeave}
        onError={this.onError}>
        <MapboxMarker
          position={this.props.origin}
          draggable={true}
          icon={firstMarkerImage}
          onDragEnd={loc => this.handleMarkerMove(false, loc)}
        />
        {secondMarker}
        {destinationMarker}
        {popup}
        {ghostMarker}
      </Map>
    );
  }

  handleChoroplethHover(feature: Feature, lngLat: LngLat, map: mapboxgl.Map) {
    const id = feature.properties.geo_id;
    const secs = this.props.times[id] || 0;
    const minutes = Math.floor(secs / 60);
    let minutes2;
    if (this.props.mode !== 'single') {
      const secs2 = this.props.times2[id];
      minutes2 = Math.floor(secs2 / 60);
    }
    this.setState({
      hover: {
        coordinates: [lngLat.lng, lngLat.lat],
        minutes,
        minutes2,
      },
    });
    map.getCanvas().style.cursor = 'pointer';
  }

  handleChoroplethLeave(map: mapboxgl.Map) {
    this.setState({
      hover: null,
    });
    map.getCanvas().style.cursor = '';
  }

  handleMarkerMove(isSecondary: boolean, latLng: LatLng) {
    this.props.handleAction({
      type: 'set-origin',
      isSecondary,
      origin: latLng,
    });
  }

  handleDestinationMove(latLng: LatLng) {
    const {lat, lng} = latLng;
    this.props.handleAction({
      type: 'set-destination',
      lat,
      lng,
    });
  }

  onClick(point: LatLng) {
    this.props.handleAction({
      type: 'set-destination',
      lat: point.lat,
      lng: point.lng,
    });
  }
}
