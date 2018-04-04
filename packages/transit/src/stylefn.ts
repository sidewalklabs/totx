import {Feature, FeatureCollection} from '../../utils';

export interface DrawingStyle {
  fillColor?: string;
  strokeColor?: string;
  lineWidth?: number;
  lineDash?: number[];
  strokeOutlineColor?: string;
  pointColor?: string;
  pointOutlineColor?: string;
  pointOutlineWidth?: number; // default is 1px
  pointRadius?: number;
  text?: {color: string; font: string; text: string; textBaseline: string; textAlign: string};
}

export type StyleFn = (feature: Feature) => DrawingStyle;

/**
 * GeoJSON feature data, along with styles specifying how to draw it on a map.
 */
export interface StyledFeatureData {
  geojson: FeatureCollection;
  styleFn: StyleFn;
  selectedStyleFn: StyleFn;
  selectedFeatureId?: string | number;
}
