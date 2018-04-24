import {Feature as GeoJSONFeature, LineString} from 'geojson';
import * as React from 'react';
import {GeoJSONLayer} from 'react-mapbox-gl';

import {shallowEqual, Feature, FeatureCollection} from '../../utils';
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

// r5 returns route GeoJSON with separate two-point line features for each step.
// Mapbox renders routes better if they're single LineString features, so we coalesce.
// TODO: get r5 to return LineStrings directly?
function coalesceFeatures(geojson: FeatureCollection): FeatureCollection {
  const features: Array<GeoJSONFeature<LineString>> = geojson.features as any;

  const outFeatures = [features[0]];
  for (let i = 1; i < features.length; i++) {
    const lastF = outFeatures[outFeatures.length - 1];
    const f = features[i];
    if (f.properties.mode === lastF.properties.mode) {
      // Coalesce
      lastF.geometry.coordinates.push(f.geometry.coordinates[1]);
    } else {
      // new feature
      outFeatures.push(f);
    }
  }

  return {type: 'FeatureCollection', features: outFeatures};
}

function makeStyledFeatures(geojson: FeatureCollection): FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: geojson.features.map(f => {
      const {properties} = f;
      const stroke = properties.stroke || '#000000';
      return {
        ...f,
        properties: {
          ...f.properties,
          lineColor: stroke,
          lineOutlineColor: mixColors(stroke, '#000000'),
          isWalk: !('tripId' in f.properties),
        },
      };
    }),
  };
}

const LINE_PAINT_TRANSIT: mapboxgl.LinePaint = {
  'line-color': ['get', 'lineColor'],
  'line-width': 4,
  'line-opacity': 0.5,
};

const LINE_PAINT_TRANSIT_CASING: mapboxgl.LinePaint = {
  'line-color': ['get', 'lineOutlineColor'],
  'line-width': 1,
  'line-gap-width': 4,
};

const LINE_PAINT_WALK: mapboxgl.LinePaint = {
  'line-color': '#000000',
  'line-width': 3,
  'line-dasharray': [1, 1],
};

// TODO: bicycle route styling

// Split a feature collection into two: one that satisfies the predicate and one that doesn't.
function splitFeatureCollection(
  featureCollection: FeatureCollection,
  predicate: (f: Feature) => boolean,
): [FeatureCollection, FeatureCollection] {
  const results: Feature[][] = [[], []];
  for (const feature of featureCollection.features) {
    results[predicate(feature) ? 0 : 1].push(feature);
  }
  return [
    {
      type: 'FeatureCollection',
      features: results[0],
    },
    {
      type: 'FeatureCollection',
      features: results[1],
    },
  ];
}

function propsToState(props: Props): State {
  const features = makeStyledFeatures(coalesceFeatures(props.geojson));
  const [walkFeatures, transitFeatures] = splitFeatureCollection(
    features,
    f => f.properties.isWalk,
  );
  return {
    walkFeatures,
    transitFeatures,
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
