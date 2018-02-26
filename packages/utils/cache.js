"use strict";
exports.__esModule = true;
var stringify = require("json-stable-stringify");
var _ = require("underscore");
/**
 * A general cache for a remote resource.
 *
 * Once a remote resource is fetched, it will always be available in the cache.
 * (It will never be evicted.)
 */
var Cache = /** @class */ (function () {
    function Cache(options) {
        var _this = this;
        this.cache = {};
        // These are fetches that are in-progress.
        // This is used to merge a second fetch for a key before the first returns.
        this.pendingFetches = {};
        this.numFetches = 0;
        this.fetch = function (key) {
            _this.numFetches++;
            return options.fetch(key);
        };
        this.stringify = options.stringify || stringify;
    }
    /**
     * Get the value for a key, either from cache or from the network.
     */
    Cache.prototype.get = function (key) {
        var _this = this;
        var stringKey = this.stringify(key);
        if (stringKey in this.cache) {
            return Promise.resolve(this.getFromCacheString(stringKey));
        }
        if (this.pendingFetches[stringKey]) {
            return this.pendingFetches[stringKey];
        }
        var promisedValue = this.fetch(key)
            .then(function (value) {
            _this.cache[stringKey] = {
                value: value,
                lastTimeMs: new Date().getTime()
            };
            delete _this.pendingFetches[stringKey];
            return value;
        })["catch"](function (err) {
            delete _this.pendingFetches[stringKey];
            return Promise.reject(err);
        });
        this.pendingFetches[stringKey] = promisedValue;
        return promisedValue;
    };
    /**
     * Retrieve a value from local cache or return null if it's not available.
     * This will never hit the network.
     */
    Cache.prototype.getFromCache = function (key) {
        return this.getFromCacheString(this.stringify(key));
    };
    /** Dump the cache's contents to a structure that can be passed to load(). */
    Cache.prototype.dump = function () {
        return _.mapObject(this.cache, function (v) { return v.value; });
    };
    /** Load dumped data into the cache. */
    Cache.prototype.load = function (contents) {
        var lastTimeMs = Date.now();
        this.cache = _.mapObject(contents, function (v) { return ({
            lastTimeMs: lastTimeMs,
            value: v
        }); });
    };
    /**
     * How many network fetches are in flight right now?
     */
    Cache.prototype.numPendingFetches = function () {
        return Object.keys(this.pendingFetches).length;
    };
    Cache.prototype.getFromCacheString = function (stringKey) {
        if (stringKey in this.cache) {
            var record = this.cache[stringKey];
            record.lastTimeMs = new Date().getTime();
            return record.value;
        }
        return null;
    };
    return Cache;
}());
exports["default"] = Cache;
