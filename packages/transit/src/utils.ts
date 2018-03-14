import {sprintf} from 'sprintf-js';
import * as _ from 'underscore';

const HHMMSS_REGEX = /([ 0-9]?\d):(\d\d):(\d\d)/;

/** Inverse of parseTime() */
export function formatTime(secs: number): string {
  const hours = Math.floor(secs / 3600);
  secs %= 3600;
  const minutes = Math.floor(secs / 60);
  secs %= 60;

  return sprintf('%2d:%02d:%02d', hours, minutes, secs);
}

/** Return the subset of obj which differs from the defaults according to _.isEqual(). */
export function withoutDefaults<T>(obj: T, defaults: T): Partial<T> {
  const out = {} as Partial<T>;
  for (const k in obj) {
    const v = obj[k];
    if (!_.isEqual(v, defaults[k])) {
      out[k] = v;
    }
  }
  return out;
}
