/**
 * Various color ramps for visualizing transit accessibility.
 */

import {scaleThreshold} from 'd3-scale';

export const SINGLE_COLORS = [
  'rgba(  0, 137, 248, 1.0)', // dark blue
  'rgba(  9, 145, 255, 0.8333)',
  'rgba(  9, 145, 255, 0.6667)',
  'rgba(  9, 145, 255, 0.5)',
  'rgba(  9, 145, 255, 0.3333)',
  'rgba(  9, 145, 255, 0.1667)', // light blue
  'rgba(  9, 145, 255, 0.0)', // fully transparent
];

export const SINGLE = scaleThreshold<number, string>()
  // Commute times in minutes
  .domain([8.5, 17, 26, 34, 43, 51, 60].map(x => x * 60))
  .range(SINGLE_COLORS);

const DIFFERENCE_DOMAIN = [
  // These are differences in commute times, in minutes.
  -27.5,
  -22.5,
  -17.5,
  -12.5,
  -7.5,
  -2.5,
  2.5,
  7.5,
  12.5,
  17.5,
  22.5,
  27.5,
].map(x => x * 60);

export const ORIGIN_COMPARISON_COLORS = [
  'rgba(  0,  83, 120, 0.6)', // blue
  'rgba( 63, 108, 140, 0.6)',
  'rgba(102, 135, 161, 0.6)',
  'rgba(138, 162, 182, 0.6)',
  'rgba(174, 190, 204, 0.6)',
  'rgba(211, 219, 226, 0.6)',
  'rgba(255, 255, 255, 0.6)', // white (equal times)
  'rgba(245, 223, 206, 0.6)',
  'rgba(242, 198, 165, 0.6)',
  'rgba(239, 174, 124, 0.6)',
  'rgba(236, 149,  82, 0.6)',
  'rgba(233, 124,  41, 0.6)',
  'rgba(231, 100,   0, 0.6)', // orange
];

export const ORIGIN_COMPARISON = scaleThreshold<number, string>()
  .domain(DIFFERENCE_DOMAIN)
  .range(ORIGIN_COMPARISON_COLORS);

export const SETTINGS_COMPARISON_COLORS = [
  'rgba(  0, 137, 248, 0.8333)', // dark blue
  'rgba(  9, 145, 255, 0.8333)',
  'rgba(  9, 145, 255, 0.6667)',
  'rgba(  9, 145, 255, 0.5)', // half blue
  'rgba( 90, 174, 230, 0.5)',
  'rgba(171, 204, 205, 0.5)',
  'rgba(252, 234, 180, 0.5)', // yellow
  'rgba(168, 222, 124, 0.5)',
  'rgba( 84, 210,  68, 0.5)',
  'rgba(  0, 199, 13, 0.5)', // half green
  'rgba(  0, 199, 13, 0.6667)',
  'rgba(  0, 199, 13, 0.8333)',
  'rgba(  0, 173, 11, 0.8333)', // green
];

export const SETTINGS_COMPARISON = scaleThreshold<number, string>()
  .domain(DIFFERENCE_DOMAIN)
  .range(SETTINGS_COMPARISON_COLORS);
