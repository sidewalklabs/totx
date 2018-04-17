import * as React from 'react';
import {GeoJSONLayer} from 'react-mapbox-gl';

import {shallowEqual, Feature, FeatureCollection} from '../../utils';
import Colors from './colors';

export interface Props {
  geojson: FeatureCollection;
  visibility: 'visible' | 'none';
  before?: string;
}

interface State {
  /** Same as props.geojson, but with fillColor set */
  styledFeatures: FeatureCollection;
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
          lineWidth: style.lineWidth || 2,
        },
      };
    }),
  };
}

const LINE_PAINT: mapboxgl.LinePaint = {
  'line-color': ['get', 'lineColor'],
  'line-width': ['get', 'lineWidth'],
  // 'line-gap-width': 2,  TODO(danvk): use this property
  // 'line-dasharray':  doesn't support data-driven styling yet.
};

export class RouteLayer extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      styledFeatures: makeStyledFeatures(props.geojson),
    };
  }

  render() {
    const {before, visibility} = this.props;
    return (
      <GeoJSONLayer
        data={this.state.styledFeatures}
        linePaint={LINE_PAINT}
        lineLayout={{visibility}}
        before={before}
      />
    );
  }

  shouldComponentUpdate(nextProps: Props, nextState: State) {
    return (
      !shallowEqual(this.props, nextProps) || nextState.styledFeatures !== this.state.styledFeatures
    );
  }

  componentWillReceiveProps(nextProps: Props) {
    if (this.props.geojson === nextProps.geojson) {
      return;
    }

    this.setState({
      styledFeatures: makeStyledFeatures(nextProps.geojson),
    });
  }
}
