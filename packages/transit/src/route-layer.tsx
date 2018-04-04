import * as React from 'react';

import {GeoJSONLayer} from 'react-mapbox-gl';
import {StyleFn} from '../../overlaymap';
import {FeatureCollection, shallowEqual} from '../../utils';

export interface Props {
  geojson: FeatureCollection;
  /** only fillColor is supported */
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
        lineColor: styleFn(f).strokeColor || 'black',
        lineWidth: styleFn(f).lineWidth || 2,
      },
    })),
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
      styledFeatures: makeStyledFeatures(props.geojson, props.styleFn),
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
    if (this.props.geojson === nextProps.geojson && this.props.styleFn === nextProps.styleFn) {
      return;
    }

    this.setState({
      styledFeatures: makeStyledFeatures(nextProps.geojson, nextProps.styleFn),
    });
  }
}
