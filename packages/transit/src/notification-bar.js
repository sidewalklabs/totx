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
/**
 * A bar overlaid on the top of the window that reports loading state and error messages.
 */
var NotificationBar = /** @class */ (function (_super) {
    __extends(NotificationBar, _super);
    function NotificationBar() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    NotificationBar.prototype.render = function () {
        if (this.props.isLoading) {
            return <div className="loading">Loading…</div>;
        }
        else if (this.props.error) {
            return (<div className="error">
          <span className="error-close" onClick={this.props.clearError}>x</span>
          {this.props.error}
        </div>);
        }
        else {
            return null;
        }
    };
    return NotificationBar;
}(React.Component));
exports["default"] = NotificationBar;
