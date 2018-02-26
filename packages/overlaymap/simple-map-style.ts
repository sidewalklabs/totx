/** A custom map, with most features either invisible or simplified. */
export const SimpleMapStyle: google.maps.MapTypeStyle[] = [
  {
    stylers: [{saturation: -50}, {lightness: 20}],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{color: '#f8f8f8'}, {visibility: 'simplified'}],
  },
  {
    featureType: 'road.arterial',
    elementType: 'all',
    stylers: [{hue: '#f8f8f8'}, {visibility: 'simplified'}],
  },
  {
    featureType: 'road.local',
    elementType: 'all',
    stylers: [{hue: '#f8f8f8'}, {gamma: 0.7}, {visibility: 'simplified'}],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{color: '#D8DBE2'}, {gamma: 0.6}, {visibility: 'on'}],
  },
  {
    featureType: 'road',
    elementType: 'labels',
    stylers: [{visibility: 'off'}],
  },
  {
    featureType: 'poi',
    elementType: 'labels',
    stylers: [{visibility: 'off'}],
  },
  {
    featureType: 'landscape.man_made',
    elementType: 'geometry',
    stylers: [{hue: '#E9E5DC '}, {visibility: 'on'}],
  },
  {
    featureType: 'administrative.locality',
    elementType: 'labels',
    stylers: [{visibility: 'off'}],
  },
  {
    featureType: 'administrative.neighborhood',
    elementType: 'labels',
    stylers: [{visibility: 'off'}],
  },
  {
    featureType: 'transit.line',
    elementType: 'geometry',
    stylers: [{hue: '#f8f8f8'}, {gamma: 2}, {visibility: 'on'}],
  },
];
