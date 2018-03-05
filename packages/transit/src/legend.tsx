import * as classNames from 'classnames';
import * as React from 'react';

import {Mode} from './action';
import {ORIGIN_COMPARISON_COLORS, SETTINGS_COMPARISON_COLORS, SINGLE_COLORS} from './ramps';

interface LegendProps {
  mode: Mode;
  currentStory: string;
}

export default function Legend(props: LegendProps) {
  switch (props.mode) {
    case 'single':
      return (
        <GeneralLegend
          {...props}
          swatches={SINGLE_COLORS}
          labelTopLeft="Travel time from origin"
          labelBottomLeft="0 min"
          labelBottomRight="60+ min"
        />
      );
    case 'compare-origin':
      return (
        <GeneralLegend
          {...props}
          swatches={ORIGIN_COMPARISON_COLORS}
          labelTopLeft={
            <span>
              More accessible from<br />
              <img src="pin-blue-A-18x26.png" width={18} height={26} />
            </span>
          }
          labelTopMiddle={<span>Equally accessible from both places<br />|</span>}
          labelTopRight={
            <span>
              More accessible from<br />
              <img src="pin-orange-B-18x26.png" width={18} height={26} />
            </span>
          }
          labelBottomLeft={<span>by 25+<br />min</span>}
          labelBottomRight={<span>by 25+<br />min</span>}
        />
      );
    case 'compare-settings':
      return (
        <GeneralLegend
          {...props}
          swatches={SETTINGS_COMPARISON_COLORS}
          labelTopLeft="More accessible with original settings"
          labelTopRight="More accessible with alternate settings"
          labelBottomLeft={<span>by 25+<br />min</span>}
          labelBottomRight={<span>by 25+<br />min</span>}
        />
      );
  }
}

interface GeneralLegendProps {
  mode: Mode;
  currentStory: string;
  labelTopLeft: string | JSX.Element;
  labelTopMiddle?: string | JSX.Element;
  labelTopRight?: string | JSX.Element;
  swatches: string[];
  labelBottomLeft: string | JSX.Element;
  labelBottomRight: string | JSX.Element;
}

function GeneralLegend(props: GeneralLegendProps) {
  const swatches = props.swatches.map((backgroundColor, i) =>
    <div key={`swatch${i}`} className="swatch" style={{backgroundColor}} />,
  );
  const className = classNames('legend', 'legend-' + props.mode, {
    'scenarios-visible': props.currentStory !== null,
  });
  return (
    <div className={className}>
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
    </div>
  );
}
