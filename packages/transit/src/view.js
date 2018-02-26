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
var React = require("react");
var ReactDOM = require("react-dom");
require("whatwg-fetch"); // fetch() polyfill.
var datastore_1 = require("./datastore");
var legend_1 = require("./legend");
var map_panel_1 = require("./map-panel");
var notification_bar_1 = require("./notification-bar");
var routing_parameters_1 = require("./routing-parameters");
var scenarios_1 = require("./scenarios");
var ABOUT_URL = 'https://docs.google.com/document/d/1YzZ6xbSuqVFyPolkVk1390vIzY1ktrc5OfNXTG3Enj0';
var rootEl = document.getElementById('root');
var store = datastore_1["default"]();
var CompareToAnotherOrigin = function (props) {
    return <div className="mode-switch compare-origin" {...props}>
    <span>+</span>
    Compare to another origin
  </div>;
};
var CompareToOtherSettings = function (props) {
    return <div className="mode-switch compare-settings" {...props}>
    <span>+</span>
    Compare to other settings
  </div>;
};
/** Root component for the transit accessibility visualization. */
var Root = /** @class */ (function (_super) {
    __extends(Root, _super);
    function Root(props) {
        var _this = _super.call(this, props) || this;
        _this.state = store.getState();
        _this.clearError = _this.clearError.bind(_this);
        _this.setOptions = _this.setOptions.bind(_this);
        return _this;
    }
    Root.prototype.render = function () {
        var handleAction = store.dispatch.bind(store);
        var setMode = function (mode) { return function () {
            handleAction({ type: 'set-mode', mode: mode });
        }; };
        return (<div className="view-map">
        <notification_bar_1["default"] error={this.state.error} isLoading={this.state.isLoading} clearError={this.clearError}/>
        <map_panel_1["default"] handleAction={handleAction} {...this.state}/>
        <div className="about">
          <a href={ABOUT_URL}>About</a>
        </div>
        <div className="front-matter">
          <routing_parameters_1["default"] {...this.state} handleAction={handleAction} onChange={this.setOptions}/>
          {this.state.mode === 'single'
            ? <div className="mode-switchers-container">
                <CompareToAnotherOrigin onClick={setMode('compare-origin')}/>
                <CompareToOtherSettings onClick={setMode('compare-settings')}/>
              </div>
            : null}
        </div>
        <legend_1["default"] mode={this.state.mode} currentStory={this.state.currentStory}/>
        <scenarios_1["default"] currentStory={this.state.currentStory} onSetStory={function (story) { return handleAction({ type: 'set-story', story: story }); }}/>
        {this.state.currentStory !== null
            ? <div className="mobile-warning">
              For a better experience, use a tablet or desktop device.
            </div>
            : null}
      </div>);
    };
    Root.prototype.componentDidMount = function () {
        var _this = this;
        store.subscribe(function () {
            _this.setState(store.getState());
        });
    };
    Root.prototype.clearError = function () {
        store.dispatch({
            type: 'report-error',
            error: null
        });
    };
    Root.prototype.setOptions = function (which, options) {
        store.dispatch({
            type: 'set-options',
            isSecondary: which === 2,
            options: options
        });
    };
    return Root;
}(React.Component));
ReactDOM.render(<Root />, rootEl);
