import * as React from 'react';
import {GeoJSONLayer} from 'react-mapbox-gl';

import {shallowEqual, Feature, FeatureCollection} from '../../utils';
import Colors from './colors';
import {mixColors} from './utils';

export interface Props {
  geojson: FeatureCollection;
  visibility: 'visible' | 'none';
  before?: string;
}

interface State {
  /** Same as props.geojson, but with fillColor set */
  walkFeatures: FeatureCollection;
  transitFeatures: FeatureCollection;
}

// Styles for steps and stops on a point-to-point route.
function routeStyle(feature: Feature) {
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
    strokeColorDark: mixColors(properties['stroke'] || 'black', '#000000'),
  };
}

function makeStyledFeatures(geojson: FeatureCollection): FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: geojson.features.map(f => {
      const style = routeStyle(f);
      return {
        ...f,
        properties: {
          ...f.properties,
          lineColor: style.strokeColor || 'black',
          lineColorDark: style.strokeColorDark || 'black',
          lineWidth: style.lineWidth || 2,
          isWalk: !('tripId' in f.properties),
        },
      };
    }),
  };
}

// Line style properties:
// - line-color
// - line-width
// - line-gap-width: Draws a line casing outside of a line's actual path. Value indicates the width of the inner gap.
// - line-dasharray: Specifies the lengths of the alternating dashes and gaps that form the dash pattern. The lengths are later scaled by the line width. To convert a dash length to pixels, multiply the length by the current line width.

const LINE_PAINT_TRANSIT: mapboxgl.LinePaint = {
  'line-color': ['get', 'lineColor'],
  'line-width': 4,
  'line-opacity': 0.5,
};

const LINE_PAINT_TRANSIT_CASING: mapboxgl.LinePaint = {
  'line-color': ['get', 'lineColorDark'],
  'line-width': 1,
  'line-gap-width': 4,
};

const LINE_PAINT_WALK: mapboxgl.LinePaint = {
  'line-color': '#000000',
  'line-width': 3,
  'line-dasharray': [1, 1],
};

// Split into four layers:
// - walks
// - bicycle rides
// - transit steps
// - transit step outlines

function filterFeatureCollection(
  features: FeatureCollection,
  predicate: (f: Feature) => boolean,
): FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: features.features.filter(predicate),
  };
}

function propsToState(props: Props): State {
  const features = makeStyledFeatures(props.geojson);
  return {
    walkFeatures: filterFeatureCollection(features, f => f.properties.isWalk),
    transitFeatures: filterFeatureCollection(features, f => !f.properties.isWalk),
  };
}

export class RouteLayer extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = propsToState(props);
  }

  render() {
    const {before, visibility} = this.props;
    return (
      <>
        <GeoJSONLayer
          data={this.state.walkFeatures}
          linePaint={LINE_PAINT_WALK}
          lineLayout={{visibility}}
          before={before}
        />
        <GeoJSONLayer
          data={this.state.transitFeatures}
          linePaint={LINE_PAINT_TRANSIT}
          lineLayout={{visibility}}
          before={before}
        />
        <GeoJSONLayer
          data={this.state.transitFeatures}
          linePaint={LINE_PAINT_TRANSIT_CASING}
          lineLayout={{visibility}}
          before={before}
        />
      </>
    );
  }

  shouldComponentUpdate(nextProps: Props, nextState: State) {
    return !shallowEqual(this.props, nextProps) || !shallowEqual(this.state, nextState);
  }

  componentWillReceiveProps(nextProps: Props) {
    if (this.props.geojson === nextProps.geojson) {
      return;
    }

    this.setState(propsToState(nextProps));
  }
}
