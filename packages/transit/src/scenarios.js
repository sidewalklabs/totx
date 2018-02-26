"use strict";
exports.__esModule = true;
var React = require("react");
var glyphs_1 = require("./glyphs");
var stories_1 = require("./stories");
var STORY_NAMES = Object.keys(stories_1["default"]);
function Scenarios(props) {
    if (!props.currentStory) {
        return (<div className="minimized-scenarios" onClick={function () { return props.onSetStory('intro'); }}>
        Scenarios
      </div>);
    }
    var story = stories_1["default"][props.currentStory];
    var index = STORY_NAMES.indexOf(props.currentStory);
    var isFirst = index === 0;
    var isLast = index === STORY_NAMES.length - 1;
    var nextStory = function () { return props.onSetStory(STORY_NAMES[index + 1]); };
    var prevStory = function () { return props.onSetStory(STORY_NAMES[index - 1]); };
    var clearStory = function () { return props.onSetStory(null); };
    var hide = { visibility: 'hidden' };
    return (<div className="scenarios">
      <div className="prev-scenario" onClick={prevStory} style={isFirst ? hide : {}}>
        {glyphs_1["default"].left}
      </div>
      <div className="scenario-text">
        <div className="header">
          {story.header}
          <span className="close-button" onClick={clearStory}>{glyphs_1["default"].close}</span>
        </div>
        <div className="subheader">{story.subHeader}</div>
      </div>
      <div className="next-scenario" onClick={nextStory} style={isLast ? hide : {}}>
        {glyphs_1["default"].right}
      </div>
    </div>);
}
exports["default"] = Scenarios;
