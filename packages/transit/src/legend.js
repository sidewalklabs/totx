"use strict";
exports.__esModule = true;
var classNames = require("classnames");
var React = require("react");
var ramps_1 = require("./ramps");
function Legend(props) {
    switch (props.mode) {
        case 'single':
            return (<GeneralLegend {...props} swatches={ramps_1.SINGLE_COLORS} labelTopLeft="Travel time from origin" labelBottomLeft="0 min" labelBottomRight="60+ min"/>);
        case 'compare-origin':
            return (<GeneralLegend {...props} swatches={ramps_1.ORIGIN_COMPARISON_COLORS} labelTopLeft={<span>
              More accessible from<br />
              <img src="pin-blue-A-18x26.png" width={18} height={26}/>
            </span>} labelTopMiddle={<span>Equally accessible from both places<br />|</span>} labelTopRight={<span>
              More accessible from<br />
              <img src="pin-orange-B-18x26.png" width={18} height={26}/>
            </span>} labelBottomLeft={<span>by 25+<br />min</span>} labelBottomRight={<span>by 25+<br />min</span>}/>);
        case 'compare-settings':
            return (<GeneralLegend {...props} swatches={ramps_1.SETTINGS_COMPARISON_COLORS} labelTopLeft="More accessible with original settings" labelTopRight="More accessible with alternate settings" labelBottomLeft={<span>by 25+<br />min</span>} labelBottomRight={<span>by 25+<br />min</span>}/>);
    }
}
exports["default"] = Legend;
function GeneralLegend(props) {
    var swatches = props.swatches.map(function (backgroundColor, i) {
        return <div key={"swatch" + i} className="swatch" style={{ backgroundColor: backgroundColor }}/>;
    });
    var className = classNames('legend', 'legend-' + props.mode, {
        'scenarios-visible': props.currentStory !== null
    });
    return (<div className={className}>
      <div className="label-top">
        <div className="left">{props.labelTopLeft}</div>
        {props.labelTopMiddle ? <div className="middle">{props.labelTopMiddle}</div> : null}
        {props.labelTopRight ? <div className="right">{props.labelTopRight}</div> : null}
      </div>
      <div className="swatches">
        {swatches}
      </div>
      <div className="label-bottom">
        <div className="left">{props.labelBottomLeft}</div>
        <div className="right">{props.labelBottomRight}</div>
      </div>
    </div>);
}
