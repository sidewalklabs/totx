import {LngLat} from 'mapbox-gl';
import * as React from 'react';

import {Feature, memoizeLast} from '../../utils';
import Action from './action';
import Colors from './colors';
import {State as DataStoreState} from './datastore';
import {LatLng} from './latlng';
import {Map} from './mapbox-map';
import {MapboxMarker} from './mapbox-marker';
import * as ramps from './ramps';
import {DrawingStyle, StyledFeatureData} from './stylefn';

type ViewProps = DataStoreState & {
  handleAction: (action: Action) => any;
};

// Styles for steps and stops on a point-to-point route.
function routeStyle(feature: Feature): DrawingStyle {
  const {properties} = feature;
  const isWalk = !('tripId' in properties);
  let pointRadius: number;
  let pointColor: string;
  let pointOutlineColor: string;
  let pointOutlineWidth: number;
  if (feature.geometry.type === 'Point') {
    const {name} = properties;
    if (name === 'Origin') {
      pointColor = Colors.blackTransparent;
      pointRadius = 8;
    } else if (name === 'Destination') {
      pointColor = Colors.blackTransparent;
      pointRadius = 8;
    } else {
      pointColor = Colors.white; // station
      pointOutlineColor = Colors.black;
      pointOutlineWidth = 2;
      pointRadius = 3;
    }
  }
  return {
    pointColor,
    pointRadius,
    pointOutlineColor,
    pointOutlineWidth,
    lineWidth: isWalk ? properties['stroke-width'] || 2 : properties['stroke-width'] || 4,
    lineDash: isWalk ? [2, 4] : null, // Walks are dotted: 2px on, 4px off.
    strokeOutlineColor: isWalk ? null : Colors.whiteTransparent,
    strokeColor: properties['stroke'] || 'black',
  };
}

interface State {}

function isDefined(x: number) {
  return x !== null && x !== undefined;
}

function makeStyleFn(args: Pick<ViewProps, 'mode' | 'times' | 'times2'>) {
  const {mode, times, times2} = args;
  if (mode === 'single') {
    return (feature: any) => {
      const id = feature.properties['geo_id'];
      const secs = times[id];
      return isDefined(secs) ? ramps.SINGLE(secs) : 'rgba(0,0,0,0)';
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
      : 'rgba(255,0,0,0)';
  };
}

const getStyleFn = memoizeLast(makeStyleFn);

/**
 * This component muxes between the data store and the generic Google Maps component.
 */
export default class Root extends React.Component<ViewProps, State> {
  private onLoad: () => void;
  private onError: (error: Error) => void;

  constructor(props: ViewProps) {
    super(props);
    this.onLoad = () => this.props.handleAction({type: 'map-ready'});
    this.onError = error => this.props.handleAction({type: 'report-error', error});
    this.onClick = this.onClick.bind(this);
    this.handleDestinationMove = this.handleDestinationMove.bind(this);
    this.handleFeatureHover = this.handleFeatureHover.bind(this);
    this.handleFeatureLeave = this.handleFeatureLeave.bind(this);
  }

  render() {
    const routes: StyledFeatureData[] = [];
    if (this.props.routes) {
      for (const route of this.props.routes) {
        if (!route) continue;
        routes.push({
          geojson: route.geojson,
          styleFn: routeStyle,
          selectedStyleFn: null,
          selectedFeatureId: null,
        });
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

    return (
      <Map
        view={this.props.view}
        geojson={this.props.geojson}
        styleFn={getStyleFn(this.props)}
        routes={routes}
        onLoad={this.onLoad}
        onClick={this.onClick}
        onMouseHover={this.handleFeatureHover}
        onMouseLeave={this.handleFeatureLeave}
        onError={this.onError}>
        <MapboxMarker
          position={this.props.origin}
          draggable={true}
          icon={firstMarkerImage}
          onDragEnd={loc => this.handleMarkerMove(false, loc)}
        />
        {secondMarker}
        {destinationMarker}
      </Map>
    );
  }

  handleFeatureHover(feature: Feature, lngLat: LngLat) {}

  handleFeatureLeave() {
    this.setState({
      hoveredFeatureId: null,
    });
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
