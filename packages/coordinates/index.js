"use strict";
// Functions and types for dealing with coordinate systems.
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
var _ = require("underscore");
// Radius of the earth in meters.
var EPSG3857_RADIUS = 6378137;
// EPSG 3857 is the same projection as Google Maps, but its units are this many times larger. Also,
// the Y axis is reversed, and the origin is arranged so that coordinates are always positive.
var EPSG3857_FACTOR = EPSG3857_RADIUS * Math.PI / 128;
/** An arbitrary x, y coordinate system. */
var XY = /** @class */ (function () {
    function XY(x, y) {
        this.x = x;
        this.y = y;
    }
    XY.prototype.toGeoJSON = function () {
        return [this.x, this.y];
    };
    return XY;
}());
exports.XY = XY;
/** A lat, lng pair. Note that unlike with XY, latitude comes first! */
var LatLng = /** @class */ (function () {
    function LatLng(lat, lng) {
        this.lat = lat;
        this.lng = lng;
    }
    LatLng.prototype.type = function () {
        return 'latlng';
    };
    LatLng.fromGeoJSON = function (p) {
        return new LatLng(p[1], p[0]);
    };
    /**
     * Convert to another coordinate system.
     * e.g., new LatLng(...).convertTo(GooglePoint) will return a point in Google projection
     * coordinates.
     */
    LatLng.prototype.convertTo = function (cls) {
        if (cls === Epsg3857Point) {
            return new cls(this.lng * (EPSG3857_RADIUS * Math.PI) / 180, Math.log(Math.tan((this.lat + 90) * Math.PI / 360)) * EPSG3857_RADIUS);
        }
        else if (cls === GooglePoint) {
            return this.convertTo(Epsg3857Point).convertTo(GooglePoint);
        }
        else {
            throw new Error('Unsupported type: ' + cls);
        }
    };
    /**
     * Get the compass heading in degrees from one lat/lng point to another. (Technically, this gets
     * the *initial* heading along the great circle between the points, but if the points are pretty
     * close, we can just call this the heading.)
     * Taken from http://www.movable-type.co.uk/scripts/latlong.html
     */
    LatLng.prototype.headingTo = function (to) {
        var srcLatRadians = this.lat * Math.PI / 180;
        var destLatRadians = to.lat * Math.PI / 180;
        var deltaLngRadians = (to.lng - this.lng) * Math.PI / 180;
        var y = Math.sin(deltaLngRadians) * Math.cos(destLatRadians);
        var x = Math.cos(srcLatRadians) * Math.sin(destLatRadians) -
            Math.sin(srcLatRadians) * Math.cos(destLatRadians) * Math.cos(deltaLngRadians);
        return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
    };
    LatLng.prototype.toGeoJSON = function () {
        return [this.lng, this.lat];
    };
    LatLng.prototype.toString = function () {
        return this.lat + ", " + this.lng;
    };
    return LatLng;
}());
exports.LatLng = LatLng;
/** A coordinate as represented in EPSG 3857 projection coordinates. */
var Epsg3857Point = /** @class */ (function (_super) {
    __extends(Epsg3857Point, _super);
    function Epsg3857Point() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Epsg3857Point.prototype.type = function () {
        return 'epsg';
    };
    Epsg3857Point.fromGeoJSON = function (p) {
        return new Epsg3857Point(p[0], p[1]);
    };
    Epsg3857Point.prototype.convertTo = function (cls) {
        if (cls === GooglePoint) {
            return new cls(128 + this.x / EPSG3857_FACTOR, 128 - this.y / EPSG3857_FACTOR);
        }
        else if (cls === LatLng) {
            return new cls(360 * Math.atan(Math.exp(this.y / EPSG3857_RADIUS)) / Math.PI - 90, 180 * this.x / (EPSG3857_RADIUS * Math.PI));
        }
        else {
            throw new Error('Unsupported type: ' + cls);
        }
    };
    // Get the length of a meter near this point in projection coordinates.
    Epsg3857Point.prototype.meterLength = function () {
        return 1 / Math.cosh(this.y / EPSG3857_RADIUS);
    };
    return Epsg3857Point;
}(XY));
exports.Epsg3857Point = Epsg3857Point;
/**
 * A coordinate as represented in Google Maps' projection coordinate system.
 * This is a version of EPSG 3857 that has been  scaled and translated so that Y coordinates
 * increase from North to South, and so that both X and Y coordinates are in the range [0, 256].
 */
var GooglePoint = /** @class */ (function (_super) {
    __extends(GooglePoint, _super);
    function GooglePoint() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    GooglePoint.prototype.type = function () {
        return 'google';
    };
    GooglePoint.fromGeoJSON = function (p) {
        return new GooglePoint(p[0], p[1]);
    };
    GooglePoint.prototype.convertTo = function (cls) {
        if (cls === Epsg3857Point) {
            return new cls((this.x - 128) * EPSG3857_FACTOR, (128 - this.y) * EPSG3857_FACTOR);
        }
        else if (cls === LatLng) {
            return this.convertTo(Epsg3857Point).convertTo(LatLng);
        }
        else {
            throw new Error('Unsupported type: ' + cls);
        }
    };
    GooglePoint.prototype.toPixel = function (scale, topLeft) {
        return { x: (this.x - topLeft.x) * scale, y: (this.y - topLeft.y) * scale };
    };
    // Get the length of a meter near this point in projection coordinates.
    GooglePoint.prototype.meterLength = function () {
        return this.convertTo(Epsg3857Point).meterLength() / EPSG3857_FACTOR;
    };
    return GooglePoint;
}(XY));
exports.GooglePoint = GooglePoint;
/** A bounding box in a specific coordinate system. */
var BoundingBox = /** @class */ (function () {
    function BoundingBox(pointType, minX, minY, maxX, maxY) {
        this.pointType = pointType;
        this.minX = minX;
        this.maxX = maxX;
        this.minY = minY;
        this.maxY = maxY;
    }
    /** Construct a bounding box from a BaseBoundingBox and a coordinate system. */
    BoundingBox.from = function (pointType, bbox) {
        return new BoundingBox(pointType, parseFloat(bbox.minX), parseFloat(bbox.minY), parseFloat(bbox.maxX), parseFloat(bbox.maxY));
    };
    /** Construct a bounding box given the points at two of its corners. */
    BoundingBox.fromPoints = function (p1, p2) {
        return new BoundingBox(p1.constructor, Math.min(p1.x, p2.x), Math.min(p1.y, p2.y), Math.max(p1.x, p2.x), Math.max(p1.y, p2.y));
    };
    /** Convert the bounding box to a different coordinate system. */
    BoundingBox.prototype.convertTo = function (pointType) {
        return BoundingBox.fromPoints(new this.pointType(this.minX, this.minY).convertTo(pointType), new this.pointType(this.maxX, this.maxY).convertTo(pointType));
    };
    /** Is this bounding box within other? */
    BoundingBox.prototype.isWithin = function (other) {
        return (this.minX >= other.minX &&
            this.maxX <= other.maxX &&
            this.minY >= other.minY &&
            this.maxY <= other.maxY);
    };
    /** Does this bounding box contain the supplied point? */
    BoundingBox.prototype.containsPoint = function (point) {
        return (this.minX <= point.x && this.maxX >= point.x && this.minY <= point.y && this.maxY >= point.y);
    };
    /** Do these two bounding boxes overlap? */
    BoundingBox.prototype.overlaps = function (other) {
        return (doRangesOverlap([this.minX, this.maxX], [other.minX, other.maxX]) &&
            doRangesOverlap([this.minY, this.maxY], [other.minY, other.maxY]));
    };
    /** The area of bounding box, in projection coordinates. */
    BoundingBox.prototype.area = function () {
        return (this.maxX - this.minX) * (this.maxY - this.minY);
    };
    /** The center of the bounding box. */
    BoundingBox.prototype.center = function () {
        return new this.pointType((this.minX + this.maxX) / 2, (this.minY + this.maxY) / 2);
    };
    /**
     * Get the center of this box (as a lat/lng pair) and the zoom level that would be needed to
     * show the whole bounding box in a 1024px by 1024px Google map.
     */
    BoundingBox.prototype.toCenterLevel = function () {
        var width = this.maxX - this.minX;
        var height = this.maxY - this.minY;
        var center = this.center().convertTo(LatLng);
        var zoomLevel = Math.round(Math.max(Math.log(1024 / width), Math.log(1024 / height)) / Math.LN2);
        return { center: center, zoomLevel: zoomLevel };
    };
    /**
     * Return a bounding box whose width and height are both multiplied by this factor.
     * For instance, a factor of 2 will result in a box that is twice as high and twice as wide.
     */
    BoundingBox.prototype.expandByFactor = function (factor) {
        var deltaWidth = (this.maxX - this.minX) * (factor - 1) / 2;
        var deltaHeight = (this.maxY - this.minY) * (factor - 1) / 2;
        return new BoundingBox(this.pointType, this.minX - deltaWidth, this.minY - deltaHeight, this.maxX + deltaWidth, this.maxY + deltaHeight);
    };
    /** Return a bounding box that fully covers a GeoJSON feature. */
    BoundingBox.fromFeature = function (feature, pointType) {
        return BoundingBox.from(pointType, boundsForCoordinates(feature.geometry.coordinates));
    };
    /** Return a bounding box that fully covers all features in a GeoJSON collection. */
    BoundingBox.fromFeatureCollection = function (featureCollection, pointType) {
        return BoundingBox.from(pointType, _.reduce(featureCollection.features.map(function (feature) {
            return boundsForCoordinates(feature.geometry.coordinates);
        }), unionOfBounds));
    };
    return BoundingBox;
}());
exports.BoundingBox = BoundingBox;
/** Do the supplied numerical ranges overlap each other? Exported for testing. */
function doRangesOverlap(a, b) {
    return a[0] <= b[1] && b[0] <= a[1];
}
exports.doRangesOverlap = doRangesOverlap;
/** Return a bounding box which contains each of the arguments. */
function unionOfBounds(a, b) {
    return {
        minX: Math.min(a.minX, b.minX),
        minY: Math.min(a.minY, b.minY),
        maxX: Math.max(a.maxX, b.maxX),
        maxY: Math.max(a.maxY, b.maxY)
    };
}
/**
 * Return a bounding box for a coordinate ring of any dimension.
 * (We don't do this via the BoundingBox object because it is performance-sensitive.)
 */
function boundsForCoordinates(coordinates) {
    if (coordinates.length === 0) {
        throw new Error('Tried to get bounds of empty coordinate array.');
    }
    if (_.isNumber(coordinates[0])) {
        // Must be an individual coordinate.
        return {
            minX: coordinates[0],
            maxX: coordinates[0],
            minY: coordinates[1],
            maxY: coordinates[1]
        };
    }
    // Check if it's an array of 2-element arrays.
    // This is purely an optimization to avoid construction of extra BoundingBox objects.
    if (_.isNumber(coordinates[0][0])) {
        var minX = coordinates[0][0];
        var maxX = minX;
        var minY = coordinates[0][1];
        var maxY = minY;
        for (var i = 1; i < coordinates.length; i++) {
            var _a = coordinates[i], x = _a[0], y = _a[1];
            if (x < minX) {
                minX = x;
            }
            else if (x > maxX) {
                maxX = x;
            }
            if (y < minY) {
                minY = y;
            }
            else if (y > maxY) {
                maxY = y;
            }
        }
        return {
            minX: minX,
            minY: minY,
            maxX: maxX,
            maxY: maxY
        };
    }
    // It must be a more complex shape. Break it down recursively.
    return _.reduce(coordinates.map(boundsForCoordinates), unionOfBounds);
}
/**
 * Transform a GeoJSON geometry from EPSG 3857 to Google's projection coordinate system.
 * Since they use the same projection, this is a simple linear transformation.
 * We don't do it via the Point objects above because this is performance-sensitive.
 */
function transformGeometryEpsg3857ToGoogle(geometry) {
    var transformCoords = function (coords) {
        if (coords.length === 0) {
            return coords;
        }
        else if (!coords[0].length) {
            return [128 + coords[0] / EPSG3857_FACTOR, 128 - coords[1] / EPSG3857_FACTOR];
        }
        else {
            return coords.map(transformCoords);
        }
    };
    return {
        type: geometry.type,
        coordinates: transformCoords(geometry.coordinates)
    };
}
exports.transformGeometryEpsg3857ToGoogle = transformGeometryEpsg3857ToGoogle;
/**
 * Transform a latitude/longitude geometry to Google.
 */
function transformGeometryLatLngToGoogle(geometry) {
    var transformCoords = function (coords) {
        if (coords.length === 0) {
            return coords;
        }
        else if (!coords[0].length) {
            return new LatLng(coords[1], coords[0]).convertTo(GooglePoint).toGeoJSON();
        }
        else {
            return coords.map(transformCoords);
        }
    };
    return {
        type: geometry.type,
        coordinates: transformCoords(geometry.coordinates)
    };
}
exports.transformGeometryLatLngToGoogle = transformGeometryLatLngToGoogle;
/**
 * Compute the distance (in meters) between two points on the earth's surface.
 * See https://en.wikipedia.org/wiki/Haversine_formula
 */
function distanceMeters(start, end) {
    var lat1 = start.lat * Math.PI / 180;
    var lng1 = start.lng * Math.PI / 180;
    var lat2 = end.lat * Math.PI / 180;
    var lng2 = end.lng * Math.PI / 180;
    var dLat = lat2 - lat1;
    var dLng = lng2 - lng1;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return EPSG3857_RADIUS * c;
}
exports.distanceMeters = distanceMeters;
