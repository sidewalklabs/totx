import * as classNames from 'classnames';
import * as React from 'react';
import * as _ from 'underscore';

// Small functional components for the dropdown lists make it easier to show two sets of controls
// for mode=compare-settings.

export interface SelectProps {
  value: string;
  onChange: (newValue: string) => any;
  isMismatch?: boolean;
  isSecondary?: boolean;
}

// Wrapper for a <select> dropdown box.
export const WrappedSelect: React.StatelessComponent<SelectProps> = props => (
  <select
    className={classNames('value', {mismatch: props.isMismatch, secondary: props.isSecondary})}
    value={props.value}
    onChange={(e: any) => props.onChange(e.target.value)}>
    {props.children}
  </select>
);

export const BikeSpeed: React.StatelessComponent<SelectProps> = props => (
  <WrappedSelect {...props}>
    <option value="10">10 km/h (Lots of traffic)</option>
    <option value="14.4">14.4 km/h (Average commute speed)</option>
    <option value="20">20 km/h (Faster than average)</option>
    <option value="30">30 km/h (Racing bike!)</option>
  </WrappedSelect>
);

const zeropad = (x: number) => (x < 10 ? '0' : '') + x;
const NOON = 12 * 60;

// This generates options at 30 minute intervals from midnight to midnight.
// For example, <option key='810' value='13:30'>1:30 PM</option>
const TIME_OPTIONS = _.range(0, 1440, 30).map(minutes => {
  const isPM = minutes >= NOON;
  const hours24 = Math.floor(minutes / 60);
  let hours12 = Math.floor((minutes % NOON) / 60);
  if (hours12 === 0) hours12 = 12;
  const hourMins = minutes % 60;
  const value = `${zeropad(hours24)}:${zeropad(hourMins)}:00`;
  const display = `${hours12}:${zeropad(hourMins)} ${isPM ? 'PM' : 'AM'}`;
  return (
    <option key={minutes} value={value}>
      {display}
    </option>
  );
});

export const TimeChooser: React.StatelessComponent<SelectProps> = props => (
  <WrappedSelect {...props}>{TIME_OPTIONS}</WrappedSelect>
);
