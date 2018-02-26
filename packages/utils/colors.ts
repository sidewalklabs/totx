/**
 * Sidewalk / Flow Color guide.
 * See https://sites.google.com/a/sidewalklabs.com/operations/home/products/flow/colors
 */

export const RED50 = '#FFEBEE';
export const RED100 = '#FFCDD2';
export const RED200 = '#EF9A9A';
export const RED300 = '#E57373';
export const RED400 = '#EF5350';
export const RED500 = '#F44336';
export const RED600 = '#E53935';
export const RED700 = '#D32F2F';
export const RED800 = '#C62828';
export const RED900 = '#B71C1C';

export const BLUE50 = '#E3F2FD';
export const BLUE100 = '#BBDEFB';
export const BLUE200 = '#90CAF9';
export const BLUE300 = '#64B5F6';
export const BLUE400 = '#42A5F5';
export const BLUE500 = '#2196F3';
export const BLUE600 = '#1E88E5';
export const BLUE700 = '#1976D2';
export const BLUE800 = '#1565C0';
export const BLUE900 = '#0D47A1';

export const GREEN50 = '#E8F5E9';
export const GREEN100 = '#C8E6C9';
export const GREEN200 = '#A5D6A7';
export const GREEN300 = '#81C784';
export const GREEN400 = '#66BB6A';
export const GREEN500 = '#4CAF50';
export const GREEN600 = '#43A047';
export const GREEN700 = '#388E3C';
export const GREEN800 = '#2E7D32';
export const GREEN900 = '#1B5E20';

export const YELLOW50 = '#FFFDE7';
export const YELLOW100 = '#FFF9C4';
export const YELLOW200 = '#FFF59D';
export const YELLOW300 = '#FFF176';
export const YELLOW400 = '#FFEE58';
export const YELLOW500 = '#FFEB3B';
export const YELLOW600 = '#FDD835';
export const YELLOW700 = '#FBC02D';
export const YELLOW800 = '#F9A825';
export const YELLOW900 = '#F57F17';

export const ORANGE50 = '#FFF3E0';
export const ORANGE100 = '#FFE0B2';
export const ORANGE200 = '#FFCC80';
export const ORANGE300 = '#FFB74D';
export const ORANGE400 = '#FFA726';
export const ORANGE500 = '#FF9800';
export const ORANGE600 = '#FB8C00';
export const ORANGE700 = '#F57C00';
export const ORANGE800 = '#EF6C00';
export const ORANGE900 = '#E65100';

export const GREY50 = '#FAFAFA';
export const GREY100 = '#F5F5F5';
export const GREY200 = '#EEEEEE';
export const GREY300 = '#E0E0E0';
export const GREY400 = '#BDBDBD';
export const GREY500 = '#9E9E9E';
export const GREY600 = '#757575';
export const GREY700 = '#616161';
export const GREY800 = '#424242';
export const GREY900 = '#212121';

// A series of bright, diverse colors that can be used for
// dynamically creating charts or backgrounds.
// Source: https://groups.google.com/forum/#!msg/google-visualization-api/ePpJQEeUX8M/W5pneVDnH9oJ
export const CHART_COLORS = [
  '#3366cc',
  '#dc3912',
  '#ff9900',
  '#109618',
  '#990099',
  '#0099c6',
  '#dd4477',
  '#66aa00',
  '#b82e2e',
  '#316395',
  '#994499',
  '#22aa99',
  '#aaaa11',
  '#6633cc',
  '#e67300',
  '#8b0707',
  '#651067',
  '#329262',
  '#5574a6',
  '#3b3eac',
  '#b77322',
  '#16d620',
  '#b91383',
  '#f4359e',
  '#9c5935',
  '#a9c413',
  '#2a778d',
  '#668d1c',
  '#bea413',
  '#0c5922',
  '#743411',
];

/** Convert a #RRGGBB color string to an rgba() string with the given opacity. */
export function rgba(color: string, alpha: number): string {
  const match = color.match(/#([0-9A-F][0-9A-F])([0-9A-F][0-9A-F])([0-9A-F][0-9A-F])/i);
  if (!match) {
    throw new Error(`Unable to parse ${color} as a #RRGGBB string`);
  }

  const [, r, g, b] = match.map(hex => parseInt(hex, 16));
  return `rgba(${r},${g},${b},${alpha})`;
}
