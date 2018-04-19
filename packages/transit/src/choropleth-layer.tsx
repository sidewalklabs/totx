import {LngLat} from 'mapbox-gl';
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
  onMouseHover?: (feature: Feature, lngLat: LngLat, map: mapboxgl.Map) => any;
  onMouseLeave?: (map: mapboxgl.Map) => any;
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
      styledFeatures: makeStyledFeatures(props.geojson, props.styleFn),
    };

    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseLeave = this.onMouseLeave.bind(this);
  }

  render() {
    const {before, visibility} = this.props;
    return (
      <GeoJSONLayer
        id="choropleth"
        data={this.state.styledFeatures}
        fillOnMouseEnter={this.onMouseMove}
        fillOnMouseLeave={this.onMouseLeave}
        fillOnMouseMove={this.onMouseMove}
        fillPaint={FILL_PAINT}
        fillLayout={{visibility}}
        before={before}
      />
    );
  }

  onMouseLeave(event: mapboxgl.MapMouseEvent) {
    const {onMouseLeave} = this.props;
    if (onMouseLeave) {
      onMouseLeave(event.target);
    }
  }

  onMouseMove(event: mapboxgl.MapMouseEvent) {
    const {onMouseHover} = this.props;
    if (onMouseHover) {
      const feature = (event as any).features[0];
      onMouseHover(feature, event.lngLat, event.target);
    }
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
