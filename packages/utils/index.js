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
var _ = require("underscore");
var auth_1 = require("./auth");
require("whatwg-fetch");
/** Fetches and expects a JSON object back from the server.
 *  Optionally takes a firebase.User object, for requests that require authentication.
 */
function fetchJSON(host, path, query, init, user) {
    if (query === void 0) { query = {}; }
    if (init === void 0) { init = {}; }
    return __awaiter(this, void 0, void 0, function () {
        var url, response, out;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (path.indexOf('/') !== 0) {
                        path = '/' + path;
                    }
                    url = buildUrl("" + host + path, query);
                    return [4 /*yield*/, auth_1.authedFetch(url, _.assign(init, {
                            headers: _.assign(init.headers || {}, { 'Content-Type': 'application/json' }),
                            credentials: 'same-origin'
                        }), user)];
                case 1:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 2:
                    out = _a.sent();
                    if (!response.ok) {
                        throw out;
                    }
                    return [2 /*return*/, out];
            }
        });
    });
}
exports.fetchJSON = fetchJSON;
// TODO(danieljy): Consolidate the following additional ajax functions with the one above or
// move them out of this package. The are more more onemap specific, but have been used outside of
// the onemap package too.
/**
 * Fix a relative path to be appropriate for the current URL.
 * We use relative paths to allow onemap to be served from a subdirectory; we assume all paths for
 * XHRs are relative to the onemap root. This function adds a leading '../' if necessary based on
 * locationPath (which should be set to the current window.location.pathname).
 * TODO(danieljy): This is onemap specific logic, that shouldn't live in this utils file.
 */
function fixRelativePath(path, locationPath) {
    if (!path.length || path.charAt(0) === '/') {
        return path;
    }
    else if (locationPath.match(/view\/[0-9]+$/)) {
        // View URLs are one level deep.
        return '../' + path;
    }
    else {
        return path;
    }
}
exports.fixRelativePath = fixRelativePath;
/**
 * Issue an XHR and return a promise for the JSON that it returns.
 * Enforces a relative path (requires acces to window) and allows
 * you to specify the method used.
 *
 * NOTE(danieljy): Consider using fetchJSON above, and/or modifying it to suit your needs, as it's
 * more flexible. It also supports firebase auth.
 */
function ajaxPromise(path, method) {
    return __awaiter(this, void 0, void 0, function () {
        var request, response, data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    method = method || 'GET';
                    request = new Request(fixRelativePath(path, window.location.pathname), {
                        credentials: 'same-origin',
                        method: method
                    });
                    return [4 /*yield*/, fetch(request)];
                case 1:
                    response = _a.sent();
                    if (!!response.ok) return [3 /*break*/, 3];
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    return [2 /*return*/, Promise.reject(data)];
                case 3: return [2 /*return*/, response.json()];
            }
        });
    });
}
exports.ajaxPromise = ajaxPromise;
/**
 * Issue a GET request with a JSON-encoded object in the query string.
 * Does not enforce relative path and allows passing a json payload.
 */
function getPromise(url, payload) {
    return __awaiter(this, void 0, void 0, function () {
        var response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (payload) {
                        url += '?' + encodeURIComponent(JSON.stringify(payload));
                    }
                    return [4 /*yield*/, fetch(url, {
                            credentials: 'same-origin',
                            method: 'GET'
                        })];
                case 1:
                    response = _a.sent();
                    if (!response.ok) {
                        return [2 /*return*/, Promise.reject(response.json())];
                    }
                    return [2 /*return*/, response.json()];
            }
        });
    });
}
exports.getPromise = getPromise;
function postPromise(path, payload, opts) {
    return __awaiter(this, void 0, void 0, function () {
        var requestOpts, request, response, data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    requestOpts = __assign({ method: 'POST', credentials: 'same-origin' }, opts);
                    if (payload instanceof FormData) {
                        requestOpts.body = payload;
                    }
                    else {
                        requestOpts.body = JSON.stringify(payload);
                        requestOpts.headers = { 'Content-Type': 'application/json' };
                    }
                    request = new Request(fixRelativePath(path, window.location.pathname), requestOpts);
                    return [4 /*yield*/, fetch(request)];
                case 1:
                    response = _a.sent();
                    if (!!response.ok) return [3 /*break*/, 3];
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    return [2 /*return*/, Promise.reject(data)];
                case 3: return [2 /*return*/, response.json()];
            }
        });
    });
}
exports.postPromise = postPromise;
/**
 * Map each element of a list to zero, one or more elements in a new list.
 */
function flatMap(xs, fn) {
    return _.flatten(xs.map(fn), true);
}
exports.flatMap = flatMap;
/**
 * Run callbacks on key/value pairs which enter, exit or change between two objects.
 * enter() is called on new keys.
 * exit() is called on keys which are deleted.
 * update() is called on keys whose values change (according to '===').
 */
function objectDiff(oldObject, newObject, callbacks) {
    if (!oldObject) {
        // All keys are new
        if (callbacks.enter) {
            _.forEach(newObject, function (value, key) {
                if (callbacks.enter) {
                    // TODO(danvk): remove after TS 2.3 update.
                    callbacks.enter(key, value);
                }
            });
        }
        return;
    }
    else if (!newObject) {
        // All keys are deleted.
        if (callbacks.exit) {
            _.forEach(oldObject, function (value, key) {
                if (callbacks.exit) {
                    // TODO(danvk): remove after TS 2.3 update.
                    callbacks.exit(key, value);
                }
            });
        }
        return;
    }
    _.forEach(oldObject, function (oldValue, key) {
        if (key in newObject) {
            var newValue = newObject[key];
            if (oldValue !== newValue) {
                if (callbacks.update)
                    callbacks.update(key, newValue, oldValue);
            }
        }
        else {
            if (callbacks.exit)
                callbacks.exit(key, oldValue);
        }
    });
    _.forEach(newObject, function (v, k) {
        if (!(k in oldObject)) {
            if (callbacks.enter)
                callbacks.enter(k, v);
        }
    });
}
exports.objectDiff = objectDiff;
/**
 * Convert an array to an object by assigning an ID to each of its values.
 * For string arrays, the function is optional.
 */
function makeObject(array, idFunction) {
    var o = {};
    array.forEach(function (value) {
        var id = idFunction(value);
        if (id in o) {
            throw new Error("Duplicate key in utils.makeObject: " + id);
        }
        o[id] = value;
    });
    return o;
}
exports.makeObject = makeObject;
/**
 * Convert an array of strings to an object with "true" values, e.g. for fast lookups.
 */
function makeLookup(array) {
    var o = {};
    array.forEach(function (key) {
        o[key] = true;
    });
    return o;
}
exports.makeLookup = makeLookup;
/**
 * Do the two objects have the same keys and values?
 * This checks for equality using '==='. It does not do a deep comparison of values.
 */
function shallowEqual(a, b) {
    if (!!a !== !!b)
        return false; // they need to be either both be null or non-null.
    for (var k in a) {
        if (a[k] !== b[k]) {
            return false;
        }
    }
    for (var k in b) {
        if (!(k in a)) {
            return false;
        }
    }
    return true;
}
exports.shallowEqual = shallowEqual;
function toQueryString(obj) {
    return _.map(obj, function (value, key) { return encodeURIComponent(key) + '=' + encodeURIComponent('' + value); }).join('&');
}
exports.toQueryString = toQueryString;
// Memoize a one-argument function.
function memoize(func) {
    var cache = [];
    return function (key) {
        var record = _.find(cache, { key: key });
        if (record) {
            return record.value;
        }
        else {
            var value = func(key);
            cache.push({ key: key, value: value });
            return value;
        }
    };
}
exports.memoize = memoize;
function reversed(list) {
    var len = list.length;
    return list.map(function (value, i) { return list[len - 1 - i]; });
}
exports.reversed = reversed;
/** This is identical to _.zip(a, b), only better typed. */
function zip(a, b) {
    return _.zip(a, b);
}
exports.zip = zip;
/** Builds url by encoding parameters. */
function buildUrl(baseUrl, data) {
    var params = [];
    _.each(data, function (value, key) {
        if (data[key] === null) {
            return;
        }
        params.push(encodeURIComponent(key) + "=" + encodeURIComponent(value));
    });
    return baseUrl + "?" + params.join('&');
}
exports.buildUrl = buildUrl;
/**
 * Removes leading indents from a template string without removing all leading whitespace.
 * Taken from tslint.
 */
function dedent(strings) {
    var values = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        values[_i - 1] = arguments[_i];
    }
    var fullString = strings.reduce(function (accumulator, str, i) { return accumulator + values[i - 1] + str; });
    // match all leading spaces/tabs at the start of each line
    var match = fullString.match(/^[ \t]*(?=\S)/gm);
    if (!match) {
        // e.g. if the string is empty or all whitespace.
        return fullString;
    }
    // find the smallest indent, we don't want to remove all leading whitespace
    var indent = Math.min.apply(Math, match.map(function (el) { return el.length; }));
    var regexp = new RegExp('^[ \\t]{' + indent + '}', 'gm');
    fullString = indent > 0 ? fullString.replace(regexp, '') : fullString;
    return fullString;
}
exports.dedent = dedent;
/** Assert that the object is not null. This is helpful with TypeScript's strictNullChecks. */
function checkNonNull(x) {
    if (x === null) {
        throw new Error('Expected non-null but got null.');
    }
    return x;
}
exports.checkNonNull = checkNonNull;
/** Run a function in a new turn of the event loop, returning a Promise for its completion. */
function defer(fn) {
    var _this = this;
    return new Promise(function (resolve, reject) {
        setImmediate(function () { return __awaiter(_this, void 0, void 0, function () {
            var _a, e_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        _a = resolve;
                        return [4 /*yield*/, fn()];
                    case 1:
                        _a.apply(void 0, [_b.sent()]);
                        return [3 /*break*/, 3];
                    case 2:
                        e_1 = _b.sent();
                        reject(e_1);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
    });
}
exports.defer = defer;
function compareTuple(as, bs) {
    if (as.length !== bs.length) {
        throw new Error("Incomparable tuples: " + as + " vs. " + bs);
    }
    for (var i = 0; i < as.length; i++) {
        var a = as[i];
        var b = bs[i];
        if (a < b)
            return -1;
        if (a > b)
            return +1;
    }
    return 0;
}
/**
 * Sort an array using a key function that maps values to a tuple of ordered values.
 * The array is sorted by the first element in the tuples, then the second, etc.
 * This is a stable sort. If two values map to the same key, then their order will be preserved.
 *
 * This is kinda like values.sort(key=lambda value: (...)) in Python.
 *
 * Returns a (shallow) copy of the array.
 */
function sortByTuple(values, keyFn) {
    // Make N + 1 tuples where the first N are the key and the last is the index.
    // Sorting this gives us the correct order and a stable sort!
    var keyIndices = values.map(function (v, i) { return keyFn(v, i).concat([i]); });
    keyIndices.sort(compareTuple);
    return keyIndices.map(function (keyIndex) { return values[keyIndex[keyIndex.length - 1]]; });
}
exports.sortByTuple = sortByTuple;
/**
 * Await an object of promises, returning an object with the same keys but resolved values.
 *
 * This is similar to Promise.all(), but for objects.
 * It can be used as a workaround for https://github.com/Microsoft/TypeScript/issues/11924
 */
function promiseObject(obj) {
    return __awaiter(this, void 0, void 0, function () {
        var keys, promises, values, out;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    keys = Object.keys(obj);
                    promises = keys.map(function (k) { return obj[k]; });
                    return [4 /*yield*/, Promise.all(promises)];
                case 1:
                    values = _a.sent();
                    out = {};
                    keys.forEach(function (k, i) {
                        out[k] = values[i];
                    });
                    return [2 /*return*/, out];
            }
        });
    });
}
exports.promiseObject = promiseObject;
