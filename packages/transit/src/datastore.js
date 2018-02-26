"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var Cookies = require("js-cookie");
var topojson = require("topojson-client");
var _ = require("underscore");
var utils_1 = require("../../utils");
var coordinates_1 = require("../../coordinates");
var utils_2 = require("../../utils");
var cache_1 = require("../../utils/cache");
var ramps = require("./ramps");
var stories_1 = require("./stories");
var utils_3 = require("./utils");
// Copied from sidewalklabs/router/online-router.ts
var TransportMode;
(function (TransportMode) {
    TransportMode[TransportMode["Transit"] = 1] = "Transit";
    TransportMode[TransportMode["Walk"] = 2] = "Walk";
})(TransportMode = exports.TransportMode || (exports.TransportMode = {}));
var INTRO_STORY = stories_1["default"]['intro'];
var INITIAL_VIEW = {
    center: new coordinates_1.LatLng(INTRO_STORY.center.lat, INTRO_STORY.center.lng),
    zoomLevel: INTRO_STORY.zoomLevel
};
exports.DEFAULT_OPTIONS = {
    departure_time: '8:00:00',
    max_walking_distance_km: 0.8,
    walking_speed_kph: 4.8,
    max_waiting_time_secs: 1800,
    transfer_penalty_secs: 300,
    max_number_of_transfers: 1,
    bus_multiplier: -1,
    rail_multiplier: 1,
    exclude_routes: [],
    exclude_stops: [],
    require_wheelchair: false
};
function fetchCommuteTimes(key) {
    var origin = key.origin, options = key.options;
    var lat = origin.lat, lng = origin.lng;
    return utils_1.getPromise('one-to-nyc', {
        origin: { lat: lat, lng: lng },
        departureTime: options.departure_time,
        options: options
    });
}
function fetchRoute(key) {
    return __awaiter(this, void 0, void 0, function () {
        var params, route;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    params = {
                        origin: { lat: key.origin.lat, lng: key.origin.lng },
                        departureTime: key.options.departure_time,
                        destination: { lat: key.destination.lat, lng: key.destination.lng },
                        options: key.options
                    };
                    return [4 /*yield*/, utils_1.getPromise('route', params)];
                case 1:
                    route = _a.sent();
                    if (!route || !route.geojson) {
                        throw new Error('Unable to load route');
                    }
                    route.geojson.features.forEach(function (f, i) {
                        f.geometry = coordinates_1.transformGeometryLatLngToGoogle(f.geometry);
                        if (!f.id)
                            f.id = 'route-' + i;
                    });
                    return [2 /*return*/, route];
            }
        });
    });
}
function formatAddress(result) {
    var componentByType = {};
    for (var _i = 0, _a = result.address_components; _i < _a.length; _i++) {
        var component = _a[_i];
        for (var _b = 0, _c = component.types; _b < _c.length; _b++) {
            var type = _c[_b];
            componentByType[type] = component.short_name;
        }
    }
    var num = componentByType['street_number'];
    var route = componentByType['route']; // e.g. '34th Street'
    var neighborhood = componentByType['neighborhood'];
    var borough = componentByType['sublocality'];
    var city = componentByType['locality'];
    var state = componentByType['administrative_area_level_1'];
    var line2 = (borough || city) + ", " + state;
    if (neighborhood)
        line2 = neighborhood + ", " + line2;
    var address = (num ? num + " " + route : route || '') + ("\n" + line2);
    return address;
}
function reverseGeocode(geocoder, location) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    geocoder.geocode({ location: location }, function (results, status) {
                        if (status !== 'OK') {
                            // The typings say this is a number, but it's a string.
                            resolve('Unknown location');
                        }
                        else {
                            resolve(formatAddress(results[0]));
                        }
                    });
                })];
        });
    });
}
var COOKIE_NAME = 'hide-scenario';
function createStore() {
    // this is used to programmatically pan and zoom the map.
    var view = INITIAL_VIEW;
    var geojson = null;
    var destination = null;
    var isLoadingGeoJSON = false;
    var error = null;
    var style = function () { return ({}); };
    var origin = new coordinates_1.LatLng(INTRO_STORY.origin.lat, INTRO_STORY.origin.lng);
    var options = __assign({}, exports.DEFAULT_OPTIONS, INTRO_STORY.options);
    var origin2 = new coordinates_1.LatLng(40.687772, -73.978498); // point in Ft. Greene
    var options2 = __assign({}, exports.DEFAULT_OPTIONS, INTRO_STORY.options2);
    var mode = INTRO_STORY.mode;
    var geocoder = new google.maps.Geocoder();
    // Default to the "intro" scenario unless the user has previously closed the scenarios bar.
    var currentStory = Cookies.get(COOKIE_NAME) ? null : 'intro';
    var gaEnabled = true; // track events with Google Analytics?
    var initPromise = null; // Promise to track when geometries and caches are loaded.
    var initialHash = window.location.hash;
    var commuteTimesCache = new cache_1["default"]({
        fetch: fetchCommuteTimes,
        stringify: function (key) { return key.origin.toString() + ' ' + JSON.stringify(key.options); }
    });
    var routesCache = new cache_1["default"]({
        fetch: fetchRoute,
        stringify: function (key) {
            return [key.origin.toString(), key.destination.toString(), JSON.stringify(key.options)].join(' ');
        }
    });
    var addressCache = new cache_1["default"]({
        fetch: function (key) { return reverseGeocode(geocoder, key); },
        stringify: function (key) { return key.toString(); }
    });
    // Neither of these are part of state; they're observed from the map and
    // used for making links and requests.
    var passiveViewport;
    function handleAction(action) {
        // Note: to ensure that gaEnabled works as intended, action handlers shouldn't make asynchronous
        // recursive calls to handleAction.
        if (gaEnabled && action.type !== 'update-bounds' && action.type !== 'map-ready') {
            ga('send', 'event', 'UI', action.type);
        }
        switch (action.type) {
            case 'set-destination':
                setDestination(action);
                break;
            case 'clear-destination':
                deselect();
                break;
            case 'update-bounds':
                updateBounds(action);
                break;
            case 'report-error':
                reportError(action);
                break;
            case 'map-ready':
                handleMapReady();
                break;
            case 'set-origin':
                handleSetOrigin(action);
                break;
            case 'set-mode':
                handleSetMode(action);
                break;
            case 'set-options':
                handleSetOptions(action);
                break;
            case 'set-story':
                handleSetStory(action);
                break;
            default:
                console.error('Unhandled action', action);
        }
    }
    function fetchRoutes() {
        if (destination) {
            routesCache.get({ origin: origin, options: options, destination: destination }).then(stateChanged, stateChanged);
            var secondaryParams = getSecondaryParams();
            if (secondaryParams) {
                routesCache.get(__assign({}, secondaryParams, { destination: destination })).then(stateChanged, stateChanged);
            }
        }
    }
    function setDestination(action) {
        destination = new coordinates_1.LatLng(action.lat, action.lng);
        fetchRoutes();
        addressCache.get(destination).then(stateChanged, stateChanged);
        stateChanged();
    }
    function deselect() {
        destination = null;
        stateChanged();
    }
    function updateBounds(action) {
        var bounds = action.bounds;
        passiveViewport = { center: bounds.center, zoomLevel: bounds.zoomLevel };
        // There's no need to go through a full state update when the viewport changes, and doing so is
        // a significant performance hit. Just updating the hash makes panning much smoother.
        updateHash();
    }
    function reportError(action) {
        if (action.error) {
            error = action.error.toString();
        }
        else {
            error = null;
        }
        stateChanged();
    }
    function handleMapReady() {
        var hash = decodeURIComponent(initialHash).slice(1);
        if (!hash)
            return;
        var obj;
        try {
            obj = JSON.parse(hash);
        }
        catch (e) {
            return; // the hash wasn't JSON.
        }
        initPromise.then(function () {
            // We do this after initialization to make sure that the caches are filled.
            setStateFromUrlParams(obj);
        });
    }
    function setStateFromUrlParams(obj) {
        // This function is implemented using actions, which messes with tracking.
        // To avoid cluttering event history, we temporarily disable it while the state updates.
        gaEnabled = false;
        if (obj.scenario) {
            handleAction({
                type: 'set-story',
                story: obj.scenario
            });
        }
        else {
            if (obj.center) {
                var _a = obj.center, lat = _a.lat, lng = _a.lng;
                view = {
                    center: new coordinates_1.LatLng(lat, lng),
                    zoomLevel: obj.zoomLevel || INITIAL_VIEW.zoomLevel
                };
                stateChanged();
            }
            handleAction({ type: 'set-mode', mode: obj.mode || 'single' });
            if (obj.origin) {
                if (obj.options)
                    options = __assign({}, exports.DEFAULT_OPTIONS, obj.options);
                handleAction({
                    type: 'set-origin',
                    origin: new coordinates_1.LatLng(obj.origin.lat, obj.origin.lng)
                });
            }
            if (obj.origin2) {
                handleAction({
                    type: 'set-origin',
                    origin: new coordinates_1.LatLng(obj.origin2.lat, obj.origin2.lng),
                    isSecondary: true
                });
            }
            if (obj.options2) {
                handleAction({
                    type: 'set-options',
                    isSecondary: true,
                    options: __assign({}, exports.DEFAULT_OPTIONS, obj.options2)
                });
            }
            if (obj.dest) {
                handleAction(__assign({ type: 'set-destination' }, obj.dest));
            }
            else {
                handleAction({ type: 'clear-destination' });
            }
        }
        gaEnabled = true;
    }
    function getSecondaryParams() {
        switch (mode) {
            case 'single':
                return null;
            case 'compare-origin':
                return { origin: origin2, options: options };
            case 'compare-settings':
                return { origin: origin, options: options2 };
        }
    }
    function getStyleFn() {
        var times = commuteTimesCache.getFromCache({ origin: origin, options: options }) || {};
        if (mode === 'single') {
            return function (feature) {
                var id = feature.properties['geo_id'];
                var secs = times[id];
                return {
                    fillColor: secs !== null ? ramps.SINGLE(secs) : 'rgba(0,0,0,0)',
                    lineWidth: 0
                };
            };
        }
        var times2 = commuteTimesCache.getFromCache(getSecondaryParams()) || {};
        var secsOrBig = function (secs) { return (secs === null ? 10000 : secs); };
        var ramp = mode === 'compare-origin' ? ramps.ORIGIN_COMPARISON : ramps.SETTINGS_COMPARISON;
        return function (feature) {
            var id = feature.properties['geo_id'];
            var secs1 = times[id];
            var secs2 = times2[id];
            return {
                fillColor: secs1 !== null || secs2 !== null
                    ? ramp(secsOrBig(secs1) - secsOrBig(secs2))
                    : 'rgba(0,0,0,0)',
                lineWidth: 0
            };
        };
    }
    function getCommuteTimePromises() {
        return __awaiter(this, void 0, void 0, function () {
            var secondaryParams, secondaryPromise, promises;
            return __generator(this, function (_a) {
                secondaryParams = getSecondaryParams();
                secondaryPromise = secondaryParams
                    ? commuteTimesCache.get(secondaryParams)
                    : Promise.resolve(null);
                promises = [commuteTimesCache.get({ origin: origin, options: options })];
                if (secondaryPromise) {
                    promises.push(secondaryPromise);
                }
                return [2 /*return*/, Promise.all(promises)];
            });
        });
    }
    function handleSetMode(action) {
        if (action.mode === mode)
            return; // no-op
        mode = action.mode;
        getCommuteTimePromises()
            .then(function () {
            style = getStyleFn();
            stateChanged();
        })["catch"](stateChanged);
        // If there's a second origin, we need to fetch its address.
        if (mode === 'compare-origin') {
            addressCache.get(origin2).then(stateChanged, stateChanged);
        }
        // If you switch from single to compare-settings, start with identical settings.
        if (mode === 'compare-settings') {
            options2 = __assign({}, options);
        }
        var secondaryParams = getSecondaryParams();
        if (destination && secondaryParams) {
            routesCache
                .get(__assign({}, secondaryParams, { destination: destination }))
                .then(stateChanged, stateChanged);
        }
        style = getStyleFn();
        stateChanged();
    }
    function handleSetOrigin(action) {
        if (action.isSecondary) {
            origin2 = action.origin;
        }
        else {
            origin = action.origin;
        }
        getCommuteTimePromises().then(function () {
            style = getStyleFn();
            stateChanged();
        });
        fetchRoutes();
        addressCache.get(action.origin).then(stateChanged, stateChanged);
        stateChanged();
    }
    function handleSetOptions(action) {
        if (action.isSecondary) {
            options2 = _.extend({}, options2, action.options);
        }
        else {
            options = _.extend({}, options, action.options);
        }
        getCommuteTimePromises()
            .then(function () {
            style = getStyleFn();
            stateChanged();
        })["catch"](stateChanged);
        fetchRoutes();
        stateChanged(); // update "loading" indicator
    }
    function handleSetStory(action) {
        currentStory = action.story;
        if (currentStory) {
            var story = stories_1["default"][currentStory];
            setStateFromUrlParams(story);
            Cookies.remove(COOKIE_NAME);
        }
        else {
            stateChanged();
            Cookies.set(COOKIE_NAME, true);
        }
    }
    function areTherePendingRequests() {
        return (isLoadingGeoJSON ||
            commuteTimesCache.numPendingFetches() > 0 ||
            routesCache.numPendingFetches() > 0 ||
            addressCache.numPendingFetches() > 0);
    }
    function getRoutes() {
        if (!destination)
            return [];
        var routes = [];
        var route1 = routesCache.getFromCache({ origin: origin, options: options, destination: destination });
        routes.push(route1);
        var secondaryParams = getSecondaryParams();
        if (secondaryParams) {
            var route2 = routesCache.getFromCache(__assign({}, secondaryParams, { destination: destination }));
            routes.push(route2);
        }
        return routes;
    }
    function orderedFeatureIds() {
        return geojson.features.map(function (f) { return f.properties.geo_id; });
    }
    // This dumps the contents of all the caches into a copy/paste-friendly textarea.
    // Navigate through the scenarios, then run dumpCache() in the console.
    if (!process.env || process.env.NODE_ENV !== 'production') {
        var dumpCache = function () {
            var ids = orderedFeatureIds();
            // The address and routes caches are reasonably small.
            // The commute times are not, but they can be greatly shrunk by dropping the keys and
            // rounding the commute times. It's important to round them _up_, so that the
            // max_commute_time_secs option for route generation is still valid.
            function simplifyCommuteTimes(v) {
                return ids.map(function (id) { return (v[id] === null ? null : Math.ceil(v[id])); });
            }
            var out = {
                addressCache: addressCache.dump(),
                routesCache: routesCache.dump(),
                commuteTimesCache: _.mapObject(commuteTimesCache.dump(), simplifyCommuteTimes)
            };
            var el = document.createElement('textarea');
            el.style.position = 'absolute';
            el.style.top = '0';
            el.style.left = '0';
            el.rows = 40;
            el.cols = 80;
            el.textContent = JSON.stringify(out);
            document.body.appendChild(el);
        };
        window['dumpCache'] = dumpCache;
    }
    function restoreCaches(cacheJson) {
        var ids = orderedFeatureIds();
        var commuteTimes = _.mapObject(cacheJson.commuteTimesCache, function (times) { return _.object(ids, times); });
        addressCache.load(cacheJson.addressCache);
        routesCache.load(cacheJson.routesCache);
        commuteTimesCache.load(commuteTimes);
    }
    function initialize() {
        isLoadingGeoJSON = true;
        initPromise = Promise.all([
            utils_2.ajaxPromise('nyc-blockgroups.land.topojson'),
            utils_2.ajaxPromise('caches.json'),
        ]).then(function (_a) {
            var nycTopojson = _a[0], cacheJson = _a[1];
            isLoadingGeoJSON = false;
            var nycGeojson = topojson.feature(nycTopojson, nycTopojson.objects['nyc-blockgroups.land']);
            nycGeojson.features.forEach(function (feature) {
                feature.geometry = coordinates_1.transformGeometryLatLngToGoogle(feature.geometry);
                feature.id = '' + feature.id; // numeric IDs get confusing.
            });
            geojson = nycGeojson;
            restoreCaches(cacheJson);
            stateChanged();
            handleSetOrigin({
                type: 'set-origin',
                origin: origin
            });
        });
    }
    function constructHash() {
        var obj = { origin: origin, options: utils_3.withoutDefaults(options, exports.DEFAULT_OPTIONS) };
        if (passiveViewport) {
            var _a = passiveViewport.center, lat = _a.lat, lng = _a.lng;
            _.extend(obj, {
                center: { lat: lat, lng: lng },
                zoomLevel: passiveViewport.zoomLevel
            });
        }
        if (mode !== 'single') {
            obj.mode = mode;
            if (mode === 'compare-origin') {
                obj.origin2 = origin2;
            }
            else if (mode === 'compare-settings') {
                obj.options2 = utils_3.withoutDefaults(options2, exports.DEFAULT_OPTIONS);
            }
        }
        if (destination) {
            obj.dest = {
                lat: destination.lat,
                lng: destination.lng
            };
        }
        return JSON.stringify(obj);
    }
    // We de-bounce this to prevent updating the URL on every frame while the user is panning the map.
    var updateHash = _.debounce(function () {
        window.location.hash = constructHash();
    }, 500);
    var subscribers = [];
    function stateChanged() {
        updateHash();
        subscribers.forEach(function (fn) { return fn(); });
    }
    function getState() {
        return {
            geojson: geojson,
            destination: destination,
            destinationAddress: destination && addressCache.getFromCache(destination),
            style: style,
            error: error,
            isLoading: areTherePendingRequests(),
            mode: mode,
            view: view,
            origin: origin,
            originAddress: addressCache.getFromCache(origin),
            options: options,
            origin2: origin2,
            origin2Address: addressCache.getFromCache(origin2),
            options2: options2,
            routes: getRoutes(),
            currentStory: currentStory
        };
    }
    initialize();
    return {
        getState: getState,
        dispatch: function (action) {
            handleAction(action);
        },
        subscribe: function (callback) {
            subscribers.push(callback);
        }
    };
}
exports["default"] = createStore;
