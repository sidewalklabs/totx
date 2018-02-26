// Firebase web configurations. Note that none of this is sensitive information, so it's okay to
// have this in source.
const NYC_TLC_1225_CONFIG = {
  apiKey: 'AIzaSyB_a4V3EcXlqQ3r4QcWr65T-d8o4sgDJ4Q',
  authDomain: 'nyc-tlc-1225.firebaseapp.com',
  databaseURL: 'https://nyc-tlc-1225.firebaseio.com',
  projectId: 'nyc-tlc-1225',
  storageBucket: 'nyc-tlc-1225.appspot.com',
  messagingSenderId: '8677857213',
};

const COORD_STAGING_CONFIG = {
  apiKey: 'AIzaSyDUDeohRjKcH4OWovsRrxfVVOw0zw4oIKo',
  authDomain: 'coord-staging.firebaseapp.com',
  databaseURL: 'https://coord-staging.firebaseio.com',
  projectId: 'coord-staging',
  storageBucket: 'coord-staging.appspot.com',
  messagingSenderId: '227277507528',
};

const COORD_PROD_CONFIG = {
  apiKey: 'AIzaSyAkcUe8G0tnPZHIKZGGnpELMCNi9nIUCu8',
  authDomain: 'coord-prod.firebaseapp.com',
  databaseURL: 'https://coord-prod.firebaseio.com',
  projectId: 'coord-prod',
  storageBucket: 'coord-prod.appspot.com',
  messagingSenderId: '699906142693',
};

export function getFirebaseConfig(projectId: string) {
  switch (projectId) {
    case 'coord-prod':
      return COORD_PROD_CONFIG;
    case 'coord-staging':
      return COORD_STAGING_CONFIG;
    default:
      return NYC_TLC_1225_CONFIG;
  }
}
