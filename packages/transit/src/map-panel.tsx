import {LatLng} from '../../coordinates';
import {BoxPlusLevel, DrawingStyle, Marker, StyledFeatureData} from '../../overlaymap';
import {Feature} from '../../utils';

import * as React from 'react';

import Action from './action';
import BasemapStyle from './basemap-style';
import Colors from './colors';
import {State as DataStoreState} from './datastore';
import {Map} from './mapbox-map';

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

/**
 * This component muxes between the data store and the generic Google Maps component.
 */
export default class Root extends React.Component<ViewProps, {}> {
  private onLoad: () => void;
  private onError: (error: Error) => void;

  constructor(props: ViewProps) {
    super(props);
    this.onLoad = () => this.props.handleAction({type: 'map-ready'});
    this.onError = error => this.props.handleAction({type: 'report-error', error});
    this.onClick = this.onClick.bind(this);
    this.handleBoundsChange = this.handleBoundsChange.bind(this);
    this.handleDestinationMove = this.handleDestinationMove.bind(this);
  }

  render() {
    const data: StyledFeatureData[] = [
      {
        geojson: this.props.geojson,
        styleFn: this.props.style,
        selectedStyleFn: null,
        selectedFeatureId: null,
      },
    ];
    if (this.props.routes) {
      for (const route of this.props.routes) {
        if (!route) continue;
        data.unshift({
          geojson: route.geojson,
          styleFn: routeStyle,
          selectedStyleFn: null,
          selectedFeatureId: null,
        });
      }
    }

    // Compare origins mode has A/B pins. Other modes have a single, blank pin.
    let firstMarkerImage = 'pin-blue-blank-24x34.png';
    let secondMarker: JSX.Element = null;
    if (this.props.mode === 'compare-origin') {
      firstMarkerImage = 'pin-blue-A-24x34.png';
      secondMarker = (
        <Marker
          position={this.props.origin2}
          draggable={true}
          icon="pin-orange-B-24x34.png"
          onDragEnd={loc => this.handleMarkerMove(true, loc)}
        />
      );
    }

    let destinationMarker: JSX.Element = null;
    if (this.props.destination) {
      destinationMarker = (
        <Marker
          position={this.props.destination}
          draggable={true}
          icon="pin-gray-blank-24x34.png"
          onDragEnd={this.handleDestinationMove}
        />
      );
    }

    return (
      <Map
        view={this.props.view}
        data={data}
        onLoad={this.onLoad}
        onClick={this.onClick}
        onError={this.onError}
        onBoundsChanged={this.handleBoundsChange}>
        <Marker
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

  handleBoundsChange(bounds: BoxPlusLevel) {
    this.props.handleAction({
      type: 'update-bounds',
      bounds,
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

  onClick(event: any, layerIndex: number, feature: Feature) {
    if (feature && feature.properties.geo_id) {
      // It's a block group.
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      this.props.handleAction({
        type: 'set-destination',
        lat,
        lng,
      });
    } else {
      this.props.handleAction({
        type: 'clear-destination',
      });
    }
  }
}
