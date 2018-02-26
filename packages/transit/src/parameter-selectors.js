"use strict";
exports.__esModule = true;
var classNames = require("classnames");
var React = require("react");
var _ = require("underscore");
// Wrapper for a <select> dropdown box.
exports.WrappedSelect = function (props) {
    return <select className={classNames('value', { mismatch: props.isMismatch, secondary: props.isSecondary })} value={props.value} onChange={function (e) { return props.onChange(e.target.value); }}>
    {props.children}
  </select>;
};
exports.MaxWalkingDistance = function (props) {
    return <exports.WrappedSelect {...props}>
    <option value="0.4">0.25 miles</option>
    <option value="0.8">0.5 miles</option>
    <option value="1.2">0.75 miles</option>
    <option value="1.6">1.0 miles</option>
    <option value="2.4">1.5 miles</option>
    <option value="3.2">2.0 miles</option>
    <option value="4">2.5 miles</option>
  </exports.WrappedSelect>;
};
exports.MaxTransfers = function (props) {
    return <exports.WrappedSelect {...props}>
    <option value="0">Exclude</option>
    <option value="1">Include</option>
    <option value="2">Allow two</option>
  </exports.WrappedSelect>;
};
exports.ModePreference = function (props) {
    return <exports.WrappedSelect {...props}>
    
    <option value="1,-1">Only use subway</option>
    <option value="1,1.5">Prefer subway</option>
    <option value="1,1">No preference</option>
    <option value="1.5,1">Prefer bus</option>
    <option value="-1,1">Only use bus</option>
  </exports.WrappedSelect>;
};
exports.RoutesChooser = function (props) {
    return <exports.WrappedSelect {...props}>
    <option value="all">All included</option>
    <option value="no-l">Exclude L</option>
    <option value="no-2nd">Exclude 2nd Ave</option>
  </exports.WrappedSelect>;
};
var zeropad = function (x) { return (x < 10 ? '0' : '') + x; };
var NOON = 12 * 60;
// This generates options at 30 minute intervals from midnight to midnight.
// For example, <option key='810' value='13:30'>1:30 PM</option>
var TIME_OPTIONS = _.range(0, 1440, 30).map(function (minutes) {
    var isPM = minutes >= NOON;
    var hours24 = Math.floor(minutes / 60);
    var hours12 = Math.floor(minutes % NOON / 60);
    if (hours12 === 0)
        hours12 = 12;
    var hourMins = minutes % 60;
    var value = hours24 + ":" + zeropad(hourMins) + ":00";
    var display = hours12 + ":" + zeropad(hourMins) + " " + (isPM ? 'PM' : 'AM');
    return <option key={minutes} value={value}>{display}</option>;
});
exports.TimeChooser = function (props) {
    return <exports.WrappedSelect {...props}>
    {TIME_OPTIONS}
  </exports.WrappedSelect>;
};
exports.WheelchairChooser = function (props) {
    return <exports.WrappedSelect {...props}>
    <option value="false">Not required</option>
    <option value="true">Required</option>
  </exports.WrappedSelect>;
};
