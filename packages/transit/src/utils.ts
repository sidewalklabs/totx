import {sprintf} from 'sprintf-js';
import * as _ from 'underscore';

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

export function parseColor(color: string) {
  if (!color.match(/^#[a-f0-9]{6}/i)) {
    throw new Error(`Expected hex color string, got ${color}`);
  }

  return {
    r: parseInt(color.slice(1, 3), 16),
    g: parseInt(color.slice(3, 5), 16),
    b: parseInt(color.slice(5, 7), 16),
  };
}

function zeropad(x: string) {
  return x.length === 1 ? '0' + x : x;
}

/** Average two hex colors */
export function mixColors(colorA: string, colorB: string): string {
  const a = parseColor(colorA);
  const b = parseColor(colorB);

  return (
    '#' +
    zeropad(((a.r + b.r) >> 1).toString(16)) +
    zeropad(((a.g + b.g) >> 1).toString(16)) +
    zeropad(((a.b + b.b) >> 1).toString(16))
  );
}
