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
var overlaymap_1 = require("../../overlaymap");
var React = require("react");
var basemap_style_1 = require("./basemap-style");
var colors_1 = require("./colors");
// Styles for steps and stops on a point-to-point route.
function routeStyle(feature) {
    var properties = feature.properties;
    var isWalk = !('tripId' in properties);
    var pointRadius;
    var pointColor;
    var pointOutlineColor;
    var pointOutlineWidth;
    if (feature.geometry.type === 'Point') {
        var name_1 = properties.name;
        if (name_1 === 'Origin') {
            pointColor = colors_1["default"].blackTransparent;
            pointRadius = 8;
        }
        else if (name_1 === 'Destination') {
            pointColor = colors_1["default"].blackTransparent;
            pointRadius = 8;
        }
        else {
            pointColor = colors_1["default"].white; // station
            pointOutlineColor = colors_1["default"].black;
            pointOutlineWidth = 2;
            pointRadius = 3;
        }
    }
    return {
        pointColor: pointColor,
        pointRadius: pointRadius,
        pointOutlineColor: pointOutlineColor,
        pointOutlineWidth: pointOutlineWidth,
        lineWidth: isWalk ? properties['stroke-width'] || 2 : properties['stroke-width'] || 4,
        lineDash: isWalk ? [2, 4] : null,
        strokeOutlineColor: isWalk ? null : colors_1["default"].whiteTransparent,
        strokeColor: properties['stroke'] || 'black'
    };
}
/**
 * This component muxes between the data store and the generic Google Maps component.
 */
var Root = /** @class */ (function (_super) {
    __extends(Root, _super);
    function Root(props) {
        var _this = _super.call(this, props) || this;
        _this.onLoad = function () { return _this.props.handleAction({ type: 'map-ready' }); };
        _this.onError = function (error) { return _this.props.handleAction({ type: 'report-error', error: error }); };
        _this.onClick = _this.onClick.bind(_this);
        _this.clearError = _this.clearError.bind(_this);
        _this.handleBoundsChange = _this.handleBoundsChange.bind(_this);
        _this.handleDestinationMove = _this.handleDestinationMove.bind(_this);
        return _this;
    }
    Root.prototype.render = function () {
        var _this = this;
        var data = [
            {
                geojson: this.props.geojson,
                styleFn: this.props.style,
                selectedStyleFn: null,
                selectedFeatureId: null
            },
        ];
        if (this.props.routes) {
            for (var _i = 0, _a = this.props.routes; _i < _a.length; _i++) {
                var route = _a[_i];
                if (!route)
                    continue;
                data.unshift({
                    geojson: route.geojson,
                    styleFn: routeStyle,
                    selectedStyleFn: null,
                    selectedFeatureId: null
                });
            }
        }
        // Compare origins mode has A/B pins. Other modes have a single, blank pin.
        var firstMarkerImage = 'pin-blue-blank-24x34.png';
        var secondMarker = null;
        if (this.props.mode === 'compare-origin') {
            firstMarkerImage = 'pin-blue-A-24x34.png';
            secondMarker = (<overlaymap_1.Marker position={this.props.origin2} draggable={true} icon="pin-orange-B-24x34.png" onDragEnd={function (loc) { return _this.handleMarkerMove(true, loc); }}/>);
        }
        var destinationMarker = null;
        if (this.props.destination) {
            destinationMarker = (<overlaymap_1.Marker position={this.props.destination} draggable={true} icon="pin-gray-blank-24x34.png" onDragEnd={this.handleDestinationMove}/>);
        }
        return (<overlaymap_1.OverlayMap view={this.props.view} data={data} mapStyles={basemap_style_1["default"]} onLoad={this.onLoad} onClick={this.onClick} onError={this.onError} onBoundsChanged={this.handleBoundsChange}>
        <overlaymap_1.Marker position={this.props.origin} draggable={true} icon={firstMarkerImage} onDragEnd={function (loc) { return _this.handleMarkerMove(false, loc); }}/>
        {secondMarker}
        {destinationMarker}
      </overlaymap_1.OverlayMap>);
    };
    Root.prototype.handleBoundsChange = function (bounds) {
        this.props.handleAction({
            type: 'update-bounds',
            bounds: bounds
        });
    };
    Root.prototype.clearError = function () {
        this.props.handleAction({
            type: 'report-error',
            error: null
        });
    };
    Root.prototype.handleMarkerMove = function (isSecondary, latLng) {
        this.props.handleAction({
            type: 'set-origin',
            isSecondary: isSecondary,
            origin: latLng
        });
    };
    Root.prototype.handleDestinationMove = function (latLng) {
        var lat = latLng.lat, lng = latLng.lng;
        this.props.handleAction({
            type: 'set-destination',
            lat: lat,
            lng: lng
        });
    };
    Root.prototype.onClick = function (event, layerIndex, feature) {
        if (feature && feature.properties.geo_id) {
            // It's a block group.
            var lat = event.latLng.lat();
            var lng = event.latLng.lng();
            this.props.handleAction({
                type: 'set-destination',
                lat: lat,
                lng: lng
            });
        }
        else {
            this.props.handleAction({
                type: 'clear-destination'
            });
        }
    };
    return Root;
}(React.Component));
exports["default"] = Root;
