import * as React from 'react';

import {GeoJSONLayer} from 'react-mapbox-gl';
import {shallowEqual, Feature, FeatureCollection} from '../../utils';

type StyleFn = (feature: Feature) => string;

/**
 * GeoJSON layer with a style function.
 * TODO(danvk): move over to data joins to avoid reserializing geometries.
 */

export interface Props {
  geojson: FeatureCollection;
  /** The style function returns the fill color for each feature */
  styleFn: StyleFn;
  visibility: 'visible' | 'none';
  before?: string;
}

interface State {
  /** Same as props.geojson, but with fillColor set */
  styledFeatures: FeatureCollection;
}

function makeStyledFeatures(geojson: FeatureCollection, styleFn: StyleFn): FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: geojson.features.map(f => ({
      ...f,
      properties: {
        ...f.properties,
        fillColor: styleFn(f),
      },
    })),
  };
}

const FILL_PAINT: mapboxgl.FillPaint = {
  'fill-color': ['get', 'fillColor'],
};

export class ChoroplethLayer extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      styledFeatures: props.geojson
        ? makeStyledFeatures(props.geojson, props.styleFn)
        : {
            type: 'FeatureCollection',
            features: [],
          },
    };
  }

  render() {
    const {before, visibility} = this.props;
    return (
      <GeoJSONLayer
        id="choropleth"
        data={this.state.styledFeatures}
        fillPaint={FILL_PAINT}
        fillLayout={{visibility}}
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
    if (this.props.geojson === nextProps.geojson && this.props.styleFn === nextProps.styleFn) {
      return;
    }

    this.setState({
      styledFeatures: makeStyledFeatures(nextProps.geojson, nextProps.styleFn),
    });
  }
}
