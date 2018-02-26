/**
 * Various color ramps for visualizing transit accessibility.
 */

import {scaleThreshold} from 'd3-scale';

export const SINGLE_COLORS = [
  'rgba(  0,  83, 120, 0.6)', // blue-green
  'rgba(  0, 106, 134, 0.6)',
  'rgba(  0, 129, 148, 0.6)',
  'rgba( 33, 153, 155, 0.6)',
  'rgba( 66, 176, 161, 0.6)',
  'rgba(110, 197, 162, 0.6)',
  'rgba(154, 217, 163, 0.6)',
  'rgba(201, 236, 167, 0.6)',
  'rgba(247, 255, 171, 0.6)', // yellow
];

export const SINGLE = scaleThreshold<number, string>()
  // Commute times in minutes
  .domain([5, 10, 15, 20, 25, 30, 45, 60].map(x => x * 60))
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
  'rgba(  0,  83, 120, 0.6)', // blue
  'rgba( 63, 108, 140, 0.6)',
  'rgba(102, 135, 161, 0.6)',
  'rgba(138, 162, 182, 0.6)',
  'rgba(174, 190, 204, 0.6)',
  'rgba(211, 219, 226, 0.6)',
  'rgba(255, 255, 255, 0.6)', // white (equal times)
  'rgba(255, 198, 196, 0.6)',
  'rgba(242, 156, 163, 0.6)',
  'rgba(218, 116, 137, 0.6)',
  'rgba(185,  80, 115, 0.6)',
  'rgba(147,  52,  93, 0.6)',
  'rgba(103,  32,  68, 0.6)', // purple
];

export const SETTINGS_COMPARISON = scaleThreshold<number, string>()
  .domain(DIFFERENCE_DOMAIN)
  .range(SETTINGS_COMPARISON_COLORS);
