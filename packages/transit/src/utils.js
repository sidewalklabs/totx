"use strict";
exports.__esModule = true;
var sprintf_js_1 = require("sprintf-js");
var _ = require("underscore");
/** Inverse of parseTime() */
function formatTime(secs) {
    var hours = Math.floor(secs / 3600);
    secs %= 3600;
    var minutes = Math.floor(secs / 60);
    secs %= 60;
    return sprintf_js_1.sprintf('%2d:%02d:%02d', hours, minutes, secs);
}
exports.formatTime = formatTime;
/** Return the subset of obj which differs from the defaults according to _.isEqual(). */
function withoutDefaults(obj, defaults) {
    var out = {};
    for (var k in obj) {
        var v = obj[k];
        if (!_.isEqual(v, defaults[k])) {
            out[k] = v;
        }
    }
    return out;
}
exports.withoutDefaults = withoutDefaults;
