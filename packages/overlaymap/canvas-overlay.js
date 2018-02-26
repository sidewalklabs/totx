"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var turfBboxPolygon = require("@turf/bbox-polygon");
var helpers_1 = require("@turf/helpers");
var turfInside = require("@turf/inside");
var coordinates_1 = require("../coordinates");
var utils_1 = require("../utils");
var rbush = require("rbush");
var turfOverlaps = require("turf-overlaps");
var _ = require("underscore");
// The maximum height/width of buffer we will allocate, in pixels.
// A hard limit here is that mobile Safari won't allocate a buffer larger than
// width * height > 16777216 (16M pixels).
var MAX_BUFFER_SIZE = 16777216;
// For mobile devices (which have devicePixelRatio = 2 or 3), it's helpful to use
// a smaller buffer to keep the number of pixels down. This is OK since the viewport
// is smaller than on desktop.
var bufferMaxWidth = Math.floor(Math.min(window.screen.width, 3000) * 1.5);
var bufferMaxHeight = Math.floor(Math.min(window.screen.height, 1500) * 1.5);
var DEFAULT_STYLE = {
    fillColor: 'rgba(33, 150, 243, 0.25)',
    strokeColor: '#2196F3',
    lineWidth: 1,
    pointColor: '#2196F3',
    pointRadius: 4
};
var SELECTED_STYLE = {
    fillColor: 'rgba(255, 105, 180, 0.25)',
    strokeColor: 'hotpink',
    lineWidth: 2,
    pointColor: 'hotpink',
    pointRadius: 4
};
/**
 * A canvas that goes on top of a Google Map for efficiently drawing lots and lots of geometries.
 * By implementing google.maps.OverlayView, we go into the map's DOM stack so we move seamlessly
 * with it and get called to redraw at the right time.
 */
var CanvasOverlay = /** @class */ (function (_super) {
    __extends(CanvasOverlay, _super);
    function CanvasOverlay(handleError) {
        var _this = _super.call(this) || this;
        _this.buffer = document.createElement('canvas');
        var pixelRatio = window.devicePixelRatio || 1;
        // If we can scale up for a Retina display without using too many pixels, do it.
        var scale = bufferMaxWidth * bufferMaxHeight * pixelRatio * pixelRatio <= MAX_BUFFER_SIZE
            ? pixelRatio
            : 1;
        _this.buffer.width = bufferMaxWidth * scale;
        _this.buffer.height = bufferMaxHeight * scale;
        _this.buffer.style.width = bufferMaxWidth + 'px';
        _this.buffer.style.height = bufferMaxHeight + 'px';
        _this.buffer.getContext('2d').scale(scale, scale);
        _this.handleError = handleError;
        _this.layers = [];
        return _this;
    }
    CanvasOverlay.prototype.onAdd = function () {
        this.div = document.createElement('div');
        _.extend(this.div.style, {
            width: bufferMaxWidth + 'px',
            height: bufferMaxHeight + 'px',
            position: 'absolute'
        });
        this.div.appendChild(this.buffer);
        this.getPanes().overlayLayer.appendChild(this.div);
    };
    CanvasOverlay.prototype.draw = function () {
        // 'false' means no new data -- the buffer will only redraw if necessary.
        this.refreshBuffer(false);
        this.arrangeDiv();
    };
    /** Update the layers being rendered. Order of layers is top-to-bottom. */
    CanvasOverlay.prototype.updateData = function (newData) {
        var _this = this;
        var oldLayers = this.layers;
        this.layers = [];
        newData.forEach(function (data, i) {
            if (oldLayers[i]) {
                var oldData = oldLayers[i].data;
                // Optimization: if the features haven't changed, we can re-use all the indices.
                if (oldData.geojson === data.geojson) {
                    _this.layers.push(oldLayers[i]);
                    oldData.selectedFeatureId = data.selectedFeatureId;
                    oldData.styleFn = data.styleFn;
                    oldData.selectedStyleFn = data.selectedStyleFn;
                    return;
                }
            }
            var layer = {
                data: data,
                idIndex: data.geojson ? _.indexBy(data.geojson.features, 'id') : null,
                geoIndex: rbush()
            };
            _this.layers.push(layer);
            _this.updateGeoIndex(layer);
        });
        try {
            this.refreshBuffer(true);
        }
        catch (error) {
            // This mostly handles runtime errors from inside the user-provided styling function.
            // TODO(jacob): the rest of the application will still think the new dataset and style have
            // been installed successfully, which may break things in the future. We should fix this at
            // some point.
            this.layers = oldLayers; // roll back.
            this.refreshBuffer(true);
            this.handleError(error);
        }
        this.arrangeDiv();
    };
    CanvasOverlay.prototype.arrangeDiv = function () {
        if (!this.bufferBounds || !this.div) {
            return;
        }
        var map = this.getMap();
        var mapProjection = map.getProjection();
        var projection = this.getProjection();
        var topLeft = projection.fromLatLngToDivPixel(mapProjection.fromPointToLatLng(new google.maps.Point(this.bufferBounds.minX, this.bufferBounds.minY)));
        this.div.style.top = topLeft.y + 'px';
        this.div.style.left = topLeft.x + 'px';
    };
    CanvasOverlay.prototype.updateGeoIndex = function (layer) {
        layer.geoIndex.clear();
        if (!layer.data.geojson)
            return;
        var featureToIndexedRect = function (feature, index) {
            var indexedBox = coordinates_1.BoundingBox.fromFeature(feature, coordinates_1.GooglePoint);
            indexedBox.index = index;
            return indexedBox;
        };
        layer.geoIndex.load(layer.data.geojson.features
            .filter(function (feature) { return feature.geometry !== null; })
            .map(featureToIndexedRect));
    };
    /**
     * Find the top-most GeoJSON feature that intersects the (pixel) coordinate.
     * Layers are interpreted as being bottom-to-top.
     *
     * Returns [layer index, Feature] or null if no feature matches.
     */
    CanvasOverlay.prototype.hitTest = function (latLng) {
        var map = this.getMap();
        var projection = map.getProjection();
        var _a = projection.fromLatLngToPoint(latLng), x = _a.x, y = _a.y;
        var padding = 5 * Math.pow(2, -this.zoom);
        var box = new coordinates_1.BoundingBox(coordinates_1.GooglePoint, x - padding, y - padding, x + padding, y + padding);
        var turfPoint = helpers_1.point([x, y]);
        var turfBox = turfBboxPolygon([box.minX, box.minY, box.maxX, box.maxY]);
        var _loop_1 = function (i) {
            var layer = this_1.layers[i];
            var candidates = layer.geoIndex.search(box);
            if (candidates.length === 0) {
                return "continue";
            }
            var features = _.sortBy(candidates, function (c) { return -c.index; }).map(function (c) { return layer.data.geojson.features[c.index]; });
            var feature = _.find(features, function (f) {
                var geometry = f.geometry;
                if (geometry.type === 'Point') {
                    return true;
                }
                else if (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon') {
                    return turfInside(turfPoint, f);
                }
                else {
                    return turfOverlaps(turfBox, f);
                }
            });
            if (feature) {
                return { value: [i, feature] };
            }
        };
        var this_1 = this;
        for (var i = 0; i < this.layers.length; i++) {
            var state_1 = _loop_1(i);
            if (typeof state_1 === "object")
                return state_1.value;
        }
        return null;
    };
    CanvasOverlay.prototype.refreshBuffer = function (newData) {
        var _this = this;
        if (!this.getMap()) {
            return;
        }
        var map = this.getMap();
        if (!map.getProjection()) {
            return;
        }
        var zoom = map.getZoom();
        var scale = 1 << zoom;
        var bounds = map.getBounds();
        var projection = map.getProjection();
        var mapTopRight = projection.fromLatLngToPoint(bounds.getNorthEast());
        var mapBottomLeft = projection.fromLatLngToPoint(bounds.getSouthWest());
        var viewportBounds = new coordinates_1.BoundingBox(coordinates_1.GooglePoint, mapBottomLeft.x, mapTopRight.y, mapTopRight.x, mapBottomLeft.y);
        if (!newData &&
            zoom === this.zoom &&
            this.bufferBounds &&
            viewportBounds.isWithin(this.bufferBounds)) {
            return; // the buffer is still valid.
        }
        this.zoom = zoom;
        var viewCenter = viewportBounds.center();
        var halfWidth = bufferMaxWidth / scale / 2;
        var halfHeight = bufferMaxHeight / scale / 2;
        this.bufferBounds = new coordinates_1.BoundingBox(coordinates_1.GooglePoint, viewCenter.x - halfWidth, viewCenter.y - halfHeight, viewCenter.x + halfWidth, viewCenter.y + halfHeight);
        var ctx = this.buffer.getContext('2d');
        ctx.clearRect(0, 0, this.buffer.width, this.buffer.height);
        var topLeft = new coordinates_1.GooglePoint(this.bufferBounds.minX, this.bufferBounds.minY);
        // Draw a list of coordinates as a segment of path.
        var drawPathSegment = function (coords) {
            var first = true;
            for (var _i = 0, coords_1 = coords; _i < coords_1.length; _i++) {
                var coord = coords_1[_i];
                var _a = coordinates_1.GooglePoint.fromGeoJSON(coord).toPixel(scale, topLeft), x = _a.x, y = _a.y;
                if (first) {
                    ctx.moveTo(x, y);
                    first = false;
                }
                else {
                    ctx.lineTo(x, y);
                }
            }
        };
        var drawFeature = function (feature, style) {
            var geometry = feature.geometry;
            if (!geometry) {
                return;
            }
            if (geometry.type === 'Point' || geometry.type === 'MultiPoint') {
                if (!style.pointRadius) {
                    return;
                }
                ctx.fillStyle = style.pointColor;
                var coords = geometry.type === 'Point'
                    ? [geometry.coordinates]
                    : geometry.coordinates;
                for (var _i = 0, coords_2 = coords; _i < coords_2.length; _i++) {
                    var coord = coords_2[_i];
                    var googlePoint = coordinates_1.GooglePoint.fromGeoJSON(coord);
                    if (!_this.bufferBounds.containsPoint(googlePoint)) {
                        continue;
                    }
                    var _a = googlePoint.toPixel(scale, topLeft), x = _a.x, y = _a.y;
                    if (style.pointOutlineColor) {
                        var pointOutlineWidth = style.pointOutlineWidth || 1;
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
            }
            else if (geometry.type === 'LineString' || geometry.type === 'MultiLineString') {
                if (!style.lineWidth) {
                    return;
                }
                ctx.strokeStyle = style.strokeColor;
                ctx.lineWidth = style.lineWidth;
                if (style.lineDash) {
                    ctx.save();
                    ctx.setLineDash(style.lineDash);
                }
                var lines = geometry.type === 'LineString'
                    ? [geometry.coordinates]
                    : geometry.coordinates;
                ctx.beginPath();
                for (var _b = 0, lines_1 = lines; _b < lines_1.length; _b++) {
                    var line = lines_1[_b];
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
                if (style.lineDash)
                    ctx.restore();
            }
            else if (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon') {
                ctx.strokeStyle = style.strokeColor;
                ctx.fillStyle = style.fillColor;
                ctx.lineWidth = style.lineWidth;
                var polygons = geometry.type === 'Polygon'
                    ? [geometry.coordinates]
                    : geometry.coordinates;
                for (var _c = 0, polygons_1 = polygons; _c < polygons_1.length; _c++) {
                    var polygon = polygons_1[_c];
                    ctx.beginPath();
                    for (var _d = 0, polygon_1 = polygon; _d < polygon_1.length; _d++) {
                        var ring = polygon_1[_d];
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
        for (var _i = 0, _a = utils_1.reversed(this.layers); _i < _a.length; _i++) {
            var layer = _a[_i];
            if (!layer.data.geojson)
                continue;
            var features = layer.data.geojson.features;
            for (var _b = 0, features_1 = features; _b < features_1.length; _b++) {
                var feature = features_1[_b];
                if (feature.geometry === null) {
                    continue;
                }
                var style = _.extend({}, DEFAULT_STYLE, layer.data.styleFn(feature));
                drawFeature(feature, style);
            }
            if (layer.data.selectedFeatureId) {
                var feature = layer.idIndex[layer.data.selectedFeatureId];
                if (feature) {
                    var customStyle = layer.data.selectedStyleFn ? layer.data.selectedStyleFn(feature) : {};
                    var style = _.extend({}, SELECTED_STYLE, customStyle);
                    drawFeature(feature, style);
                }
            }
        }
    };
    return CanvasOverlay;
}(google.maps.OverlayView));
exports.CanvasOverlay = CanvasOverlay;
