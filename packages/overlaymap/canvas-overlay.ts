import * as turfBboxPolygon from '@turf/bbox-polygon';
import {point} from '@turf/helpers';
import * as turfInside from '@turf/inside';

import {BoundingBox, GeoJSONPoint, GooglePoint} from '../coordinates';
import {reversed, Feature, FeatureCollection} from '../utils';

import * as rbush from 'rbush';
import * as turfOverlaps from 'turf-overlaps';
import * as _ from 'underscore';

// The maximum height/width of buffer we will allocate, in pixels.
// A hard limit here is that mobile Safari won't allocate a buffer larger than
// width * height > 16777216 (16M pixels).
const MAX_BUFFER_SIZE = 16777216;

// For mobile devices (which have devicePixelRatio = 2 or 3), it's helpful to use
// a smaller buffer to keep the number of pixels down. This is OK since the viewport
// is smaller than on desktop.
const bufferMaxWidth = Math.floor(Math.min(window.screen.width, 3000) * 1.5);
const bufferMaxHeight = Math.floor(Math.min(window.screen.height, 1500) * 1.5);

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

const DEFAULT_STYLE: DrawingStyle = {
  fillColor: 'rgba(33, 150, 243, 0.25)',
  strokeColor: '#2196F3',
  lineWidth: 1,
  pointColor: '#2196F3',
  pointRadius: 4,
};

const SELECTED_STYLE: DrawingStyle = {
  fillColor: 'rgba(255, 105, 180, 0.25)',
  strokeColor: 'hotpink',
  lineWidth: 2,
  pointColor: 'hotpink',
  pointRadius: 4,
};

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

interface IndexedRect extends rbush.BBox {
  index?: number;
}

interface Layer {
  data: StyledFeatureData;

  idIndex: {[id: string]: Feature};
  geoIndex: rbush.RBush<IndexedRect>;
}

/**
 * A canvas that goes on top of a Google Map for efficiently drawing lots and lots of geometries.
 * By implementing google.maps.OverlayView, we go into the map's DOM stack so we move seamlessly
 * with it and get called to redraw at the right time.
 */
export class CanvasOverlay extends google.maps.OverlayView {
  private layers: Layer[];

  private buffer: HTMLCanvasElement;
  private bufferBounds: BoundingBox<GooglePoint>;
  private zoom: number;
  private div: HTMLElement;
  private handleError: (error: Error) => any;

  constructor(handleError: (error: Error) => any) {
    super();
    this.buffer = document.createElement('canvas');

    const pixelRatio = window.devicePixelRatio || 1;

    // If we can scale up for a Retina display without using too many pixels, do it.
    const scale =
      bufferMaxWidth * bufferMaxHeight * pixelRatio * pixelRatio <= MAX_BUFFER_SIZE
        ? pixelRatio
        : 1;

    this.buffer.width = bufferMaxWidth * scale;
    this.buffer.height = bufferMaxHeight * scale;
    this.buffer.style.width = bufferMaxWidth + 'px';
    this.buffer.style.height = bufferMaxHeight + 'px';
    this.buffer.getContext('2d').scale(scale, scale);

    this.handleError = handleError;

    this.layers = [];
  }

  onAdd() {
    this.div = document.createElement('div');
    _.extend(this.div.style, {
      width: bufferMaxWidth + 'px',
      height: bufferMaxHeight + 'px',
      position: 'absolute',
    });

    this.div.appendChild(this.buffer);

    this.getPanes().overlayLayer.appendChild(this.div);
  }

  draw() {
    // 'false' means no new data -- the buffer will only redraw if necessary.
    this.refreshBuffer(false);
    this.arrangeDiv();
  }

  /** Update the layers being rendered. Order of layers is top-to-bottom. */
  updateData(newData: StyledFeatureData[]) {
    const oldLayers = this.layers;

    this.layers = [];
    newData.forEach((data, i) => {
      if (oldLayers[i]) {
        const oldData = oldLayers[i].data;
        // Optimization: if the features haven't changed, we can re-use all the indices.
        if (oldData.geojson === data.geojson) {
          this.layers.push(oldLayers[i]);
          oldData.selectedFeatureId = data.selectedFeatureId;
          oldData.styleFn = data.styleFn;
          oldData.selectedStyleFn = data.selectedStyleFn;
          return;
        }
      }

      const layer = {
        data,
        idIndex: data.geojson ? _.indexBy(data.geojson.features, 'id') : null,
        geoIndex: rbush<IndexedRect>(),
      };
      this.layers.push(layer);
      this.updateGeoIndex(layer);
    });

    try {
      this.refreshBuffer(true);
    } catch (error) {
      // This mostly handles runtime errors from inside the user-provided styling function.
      // TODO(jacob): the rest of the application will still think the new dataset and style have
      // been installed successfully, which may break things in the future. We should fix this at
      // some point.
      this.layers = oldLayers; // roll back.
      this.refreshBuffer(true);
      this.handleError(error);
    }

    this.arrangeDiv();
  }

  private arrangeDiv() {
    if (!this.bufferBounds || !this.div) {
      return;
    }

    const map = this.getMap() as google.maps.Map;
    const mapProjection = map.getProjection();
    const projection = this.getProjection();
    const topLeft = projection.fromLatLngToDivPixel(
      mapProjection.fromPointToLatLng(
        new google.maps.Point(this.bufferBounds.minX, this.bufferBounds.minY),
      ),
    );

    this.div.style.top = topLeft.y + 'px';
    this.div.style.left = topLeft.x + 'px';
  }

  private updateGeoIndex(layer: Layer) {
    layer.geoIndex.clear();
    if (!layer.data.geojson) return;

    const featureToIndexedRect = (feature: Feature, index: number) => {
      const indexedBox = BoundingBox.fromFeature(feature, GooglePoint) as IndexedRect;
      indexedBox.index = index;
      return indexedBox;
    };

    layer.geoIndex.load(
      layer.data.geojson.features
        .filter(feature => feature.geometry !== null)
        .map(featureToIndexedRect),
    );
  }

  /**
   * Find the top-most GeoJSON feature that intersects the (pixel) coordinate.
   * Layers are interpreted as being bottom-to-top.
   *
   * Returns [layer index, Feature] or null if no feature matches.
   */
  public hitTest(latLng: google.maps.LatLng): [number, Feature] {
    const map = this.getMap() as google.maps.Map;
    const projection = map.getProjection();
    const {x, y} = projection.fromLatLngToPoint(latLng);
    const padding = 5 * Math.pow(2, -this.zoom);

    const box = new BoundingBox(GooglePoint, x - padding, y - padding, x + padding, y + padding);
    const turfPoint = point([x, y]);
    const turfBox = turfBboxPolygon([box.minX, box.minY, box.maxX, box.maxY]);

    for (let i = 0; i < this.layers.length; i++) {
      const layer = this.layers[i];
      const candidates = layer.geoIndex.search(box);
      if (candidates.length === 0) {
        continue;
      }
      const features = _.sortBy(candidates, c => -c.index).map(
        c => layer.data.geojson.features[c.index],
      );

      const feature = _.find(features, f => {
        const {geometry} = f;
        if (geometry.type === 'Point') {
          return true;
        } else if (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon') {
          return turfInside(turfPoint, f as GeoJSON.Feature<GeoJSON.Polygon>);
        } else {
          return turfOverlaps(turfBox, f);
        }
      });

      if (feature) {
        return [i, feature];
      }
    }
    return null;
  }

  private refreshBuffer(newData: boolean) {
    if (!this.getMap()) {
      return;
    }

    const map = this.getMap() as google.maps.Map;

    if (!map.getProjection()) {
      return;
    }

    const zoom = map.getZoom();
    const scale = 1 << zoom;
    const bounds = map.getBounds();
    const projection = map.getProjection();
    const mapTopRight = projection.fromLatLngToPoint(bounds.getNorthEast());
    const mapBottomLeft = projection.fromLatLngToPoint(bounds.getSouthWest());
    const viewportBounds = new BoundingBox(
      GooglePoint,
      mapBottomLeft.x,
      mapTopRight.y,
      mapTopRight.x,
      mapBottomLeft.y,
    );

    if (
      !newData &&
      zoom === this.zoom &&
      this.bufferBounds &&
      viewportBounds.isWithin(this.bufferBounds)
    ) {
      return; // the buffer is still valid.
    }
    this.zoom = zoom;

    const viewCenter = viewportBounds.center();

    const halfWidth = bufferMaxWidth / scale / 2;
    const halfHeight = bufferMaxHeight / scale / 2;
    this.bufferBounds = new BoundingBox(
      GooglePoint,
      viewCenter.x - halfWidth,
      viewCenter.y - halfHeight,
      viewCenter.x + halfWidth,
      viewCenter.y + halfHeight,
    );

    const ctx = this.buffer.getContext('2d');
    ctx.clearRect(0, 0, this.buffer.width, this.buffer.height);
    const topLeft = new GooglePoint(this.bufferBounds.minX, this.bufferBounds.minY);

    // Draw a list of coordinates as a segment of path.
    const drawPathSegment = (coords: GeoJSONPoint[]) => {
      let first = true;
      for (const coord of coords) {
        const {x, y} = GooglePoint.fromGeoJSON(coord).toPixel(scale, topLeft);
        if (first) {
          ctx.moveTo(x, y);
          first = false;
        } else {
          ctx.lineTo(x, y);
        }
      }
    };

    const drawFeature = (feature: Feature, style: DrawingStyle) => {
      const geometry = feature.geometry;
      if (!geometry) {
        return;
      }
      if (geometry.type === 'Point' || geometry.type === 'MultiPoint') {
        if (!style.pointRadius) {
          return;
        }

        ctx.fillStyle = style.pointColor;

        const coords: GeoJSONPoint[] =
          geometry.type === 'Point' ? [geometry.coordinates] : geometry.coordinates;
        for (const coord of coords) {
          const googlePoint = GooglePoint.fromGeoJSON(coord);
          if (!this.bufferBounds.containsPoint(googlePoint)) {
            continue;
          }

          const {x, y} = googlePoint.toPixel(scale, topLeft);
          if (style.pointOutlineColor) {
            const pointOutlineWidth = style.pointOutlineWidth || 1;
            ctx.save();
            ctx.fillStyle = style.pointOutlineColor;
            ctx.beginPath();
            ctx.arc(x, y, style.pointRadius + pointOutlineWidth, 0, Math.PI * 2, false);
            ctx.fill();
            ctx.restore();
          }
          ctx.beginPath();
          ctx.arc(x, y, style.pointRadius, 0, Math.PI * 2, false);
          ctx.fill();
          if (style.text) {
            // Style for labeling a point.
            ctx.save();
            ctx.fillStyle = style.text.color;
            ctx.textAlign = style.text.textAlign;
            ctx.textBaseline = style.text.textBaseline;
            ctx.font = style.text.font;
            ctx.fillText(style.text.text, x, y);
            ctx.restore();
          }
        }
      } else if (geometry.type === 'LineString' || geometry.type === 'MultiLineString') {
        if (!style.lineWidth) {
          return;
        }
        ctx.strokeStyle = style.strokeColor;
        ctx.lineWidth = style.lineWidth;
        if (style.lineDash) {
          ctx.save();
          ctx.setLineDash(style.lineDash);
        }

        const lines: GeoJSONPoint[][] =
          geometry.type === 'LineString' ? [geometry.coordinates] : geometry.coordinates;
        ctx.beginPath();
        for (const line of lines) {
          drawPathSegment(line);
        }
        if (style.strokeOutlineColor) {
          // Draw a wider path under the primary one to create an outline.
          ctx.save();
          ctx.strokeStyle = style.strokeOutlineColor;
          ctx.lineWidth = style.lineWidth + 2;
          ctx.stroke(); // The canvas will re-use the old path.
          ctx.restore();
        }
        ctx.stroke();
        if (style.lineDash) ctx.restore();
      } else if (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon') {
        ctx.strokeStyle = style.strokeColor;
        ctx.fillStyle = style.fillColor;
        ctx.lineWidth = style.lineWidth;

        const polygons: GeoJSONPoint[][][] =
          geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
        for (const polygon of polygons) {
          ctx.beginPath();
          for (const ring of polygon) {
            drawPathSegment(ring);
          }
          if (style.lineWidth) {
            ctx.stroke();
          }
          if (style.fillColor) {
            ctx.fill();
          }
        }
      }
    };

    for (const layer of reversed(this.layers)) {
      if (!layer.data.geojson) continue;
      const features = layer.data.geojson.features;
      for (const feature of features) {
        if (feature.geometry === null) {
          continue;
        }
        const style = _.extend({}, DEFAULT_STYLE, layer.data.styleFn(feature));
        drawFeature(feature, style);
      }

      if (layer.data.selectedFeatureId) {
        const feature = layer.idIndex[layer.data.selectedFeatureId];
        if (feature) {
          const customStyle = layer.data.selectedStyleFn ? layer.data.selectedStyleFn(feature) : {};
          const style = _.extend({}, SELECTED_STYLE, customStyle);
          drawFeature(feature, style);
        }
      }
    }
  }
}
