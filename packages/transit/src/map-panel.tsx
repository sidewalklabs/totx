import {LngLat} from 'mapbox-gl';
import * as React from 'react';
import {Popup} from 'react-mapbox-gl';

import _ = require('underscore');
import {makeObject, memoizeLast, Feature, FeatureCollection} from '../../utils';
import Action from './action';
import Colors from './colors';
import {State as DataStoreState} from './datastore';
import {CenterZoomLevel, LatLng} from './latlng';
import {Map} from './mapbox-map';
import {MapboxMarker} from './mapbox-marker';
import * as ramps from './ramps';

type ViewProps = DataStoreState & {
  handleAction: (action: Action) => any;
};

interface State {
  isDraggingMarker: boolean;
  view: CenterZoomLevel;
  hover: {
    coordinates: [number, number]; // lng, lat
    minutes: string;
    minutes2?: string;
    isDestinationHover?: boolean;
  } | null;
}

const THREE_HOURS_SECS = 3 * 60 * 60;

function isValidCommute(x: number) {
  return x !== null && x !== undefined && x <= THREE_HOURS_SECS;
}

function getFillColors(args: Pick<ViewProps, 'mode' | 'times' | 'times2'>) {
  const {mode, times, times2} = args;

  if (mode === 'single') {
    return _.mapObject(
      times,
      (secs, id) => (isValidCommute(secs) ? ramps.SINGLE(secs) : Colors.clear),
    );
  } else {
    const secsOrBig = (secs: number) => (!isValidCommute(secs) ? 10000 : secs);
    const ramp = mode === 'compare-origin' ? ramps.ORIGIN_COMPARISON : ramps.SETTINGS_COMPARISON;

    return makeObject(_.union(Object.keys(times), Object.keys(times2)), id => {
      const secs1 = times[id];
      const secs2 = times2[id];
      return isValidCommute(secs1) || isValidCommute(secs2)
        ? ramp(secsOrBig(secs1) - secsOrBig(secs2))
        : Colors.clear;
    });
  }
}

const getFillColorsFn = memoizeLast(getFillColors);

/** Format seconds as a number of minutes for display. */
function formatSecs(secs: number) {
  return isValidCommute(secs) ? Math.floor(secs / 60) + ' min' : 'n/a';
}

// These constants define rectangles around origin and destination markers over which
// the hover interaction shouldn't happen. This allows the user to drag the markers.
// See comment in addMapCanvasEventListeners(), below.
const MARKER_SIZES_PX = {
  origin: {
    minDx: -25,
    maxDx: 25,
    minDy: -15,
    maxDy: 45,
  },
  destination: {
    minDx: -20,
    maxDx: 20,
    minDy: -20,
    maxDy: 20,
  },
};

interface PointXY {
  x: number;
  y: number;
}

function isDeltaInRange(delta: PointXY, range: typeof MARKER_SIZES_PX.origin) {
  return (
    delta.x >= range.minDx &&
    delta.x <= range.maxDx &&
    delta.y >= range.minDy &&
    delta.y <= range.maxDy
  );
}

/**
 * This component muxes between the data store and the generic Google Maps component.
 */
export default class Root extends React.Component<ViewProps, State> {
  private onLoad: (map: mapboxgl.Map) => any;
  private onError: (error: Error) => void;

  constructor(props: ViewProps) {
    super(props);
    this.onLoad = map => {
      // This eliminates a flicker as you drag markers around.
      // See https://github.com/alex3165/react-mapbox-gl/issues/580
      (map as any)._fadeDuration = 0;

      this.addMapCanvasEventListeners(map);
      this.props.handleAction({type: 'map-ready'});
    };

    this.onError = error => this.props.handleAction({type: 'report-error', error});
    this.onClick = this.onClick.bind(this);
    this.startDrag = this.startDrag.bind(this);
    this.handleDestinationMove = this.handleDestinationMove.bind(this);

    this.state = {
      view: props.view,
      hover: null,
      isDraggingMarker: false,
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
    const {view} = this.props;

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
          onDragStart={this.startDrag}
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
          icon="destination-marker"
          iconAnchor="center"
          onDragStart={this.startDrag}
          onDragEnd={this.handleDestinationMove}
        />
      );
    }

    let popup: JSX.Element = null;
    let ghostMarker: JSX.Element = null;
    const {hover} = this.state;
    if (hover) {
      popup = (
        <Popup coordinates={hover.coordinates} offset={[0, -10]}>
          {hover.minutes2 ? (
            <div className={'secondary ' + this.props.mode}>{hover.minutes2}</div>
          ) : null}
          <div className="primary">{hover.minutes}</div>
        </Popup>
      );
      const [lng, lat] = hover.coordinates;
      const position = new LatLng(lat, lng);
      if (!hover.isDestinationHover) {
        ghostMarker = (
          <MapboxMarker position={position} icon="destination-marker" iconAnchor="center" />
        );
      }
    }

    return (
      <Map
        view={view}
        fillColors={getFillColorsFn(this.props)}
        defaultFillColor={Colors.clear}
        routes={routes}
        onLoad={this.onLoad}
        onClick={this.onClick}
        onError={this.onError}>
        <MapboxMarker
          position={this.props.origin}
          draggable={true}
          icon={firstMarkerImage}
          id="origin"
          onDragStart={this.startDrag}
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
    let secs2;
    if (this.props.mode !== 'single') {
      secs2 = this.props.times2[id];
    }
    this.setState({
      hover: {
        coordinates: [lngLat.lng, lngLat.lat],
        minutes: formatSecs(secs),
        minutes2: secs2 && formatSecs(secs2),
      },
    });
    map.getCanvas().style.cursor = 'pointer';
  }

  handleDestinationHover() {
    const {destination, routes} = this.props;
    const secs = routes && routes[0] && routes[0].travelTimeSecs;
    const secs2 = routes && routes[1] && routes[1].travelTimeSecs;
    this.setState({
      hover: {
        coordinates: [destination.lng, destination.lat],
        minutes: formatSecs(secs),
        minutes2: secs2 && formatSecs(secs2),
        isDestinationHover: true,
      },
    });
  }

  handleChoroplethLeave(map: mapboxgl.Map) {
    this.setState({
      hover: null,
    });
    map.getCanvas().style.cursor = '';
  }

  handleMarkerMove(isSecondary: boolean, latLng: LatLng) {
    this.setState({
      isDraggingMarker: false,
    });
    this.props.handleAction({
      type: 'set-origin',
      isSecondary,
      origin: latLng,
    });
  }

  handleDestinationMove(latLng: LatLng) {
    const {lat, lng} = latLng;
    this.setState({
      isDraggingMarker: false,
    });
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

  startDrag() {
    this.setState({
      isDraggingMarker: true,
      hover: null,
    });
  }

  getDxDy(point: PointXY, marker: LatLng, map: mapboxgl.Map): PointXY {
    const markerPoint = map.project([marker.lng, marker.lat]);
    const dx = markerPoint.x - point.x;
    const dy = markerPoint.y - point.y;
    return {x: dx, y: dy};
  }

  // Determine whether the mouse is over any of the markers on the map.
  isMouseOverMarker(point: PointXY, map: mapboxgl.Map) {
    const {origin, origin2, destination} = this.props;
    if (isDeltaInRange(this.getDxDy(point, origin, map), MARKER_SIZES_PX.origin)) {
      return 'origin1';
    }
    if (origin2 && isDeltaInRange(this.getDxDy(point, origin2, map), MARKER_SIZES_PX.origin)) {
      return 'origin2';
    }
    if (
      destination &&
      isDeltaInRange(this.getDxDy(point, destination, map), MARKER_SIZES_PX.destination)
    ) {
      return 'destination';
    }
    return null;
  }

  addMapCanvasEventListeners(map: mapboxgl.Map) {
    const mapboxCanvas = map.getCanvas();
    let wasHovering = false;

    // We want to synthesize hover events, but only when the mouse is over the
    // choropleth, rather than over a draggable marker. We do this by registering
    // events on the map's <canvas> element (rather than on the mapbox Map) because of
    // https://github.com/alex3165/react-mapbox-gl/issues/579
    mapboxCanvas.addEventListener('mousemove', e => {
      if (this.state.isDraggingMarker) return;

      const {clientX, clientY} = e;
      const pt = [clientX, clientY];

      const overMarker = this.isMouseOverMarker({x: pt[0], y: pt[1]}, map);
      if (overMarker) {
        if (overMarker === 'destination') {
          this.handleDestinationHover();
        }
        if (wasHovering) {
          this.handleChoroplethLeave(map);
          wasHovering = false;
        }
        return;
      }

      const features = map.queryRenderedFeatures(pt);
      let hoverFeature: typeof features[0];
      for (const feature of features) {
        if (feature.properties && feature.properties.geo_id) {
          hoverFeature = feature;
        }
      }

      if (hoverFeature) {
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

    mapboxCanvas.addEventListener('mouseleave', e => {
      if (wasHovering) {
        wasHovering = false;
        this.handleChoroplethLeave(map);
      }
    });
  }
}
