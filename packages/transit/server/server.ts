import * as express from 'express';
import * as url from 'url';
import {wrapPromise} from '../../utils/express-promise';
import R5Router from './r5/r5';

const gzipStatic = require('connect-gzip-static');
const program = require('commander');

program
  .version('1.0.0')
  .description('Serve geographical data from a PostGIS database.')
  .option('-p, --port <port>', 'Port on which to serve traffic (default: 1337)', Number, 1337)
  .option('--router-url <url>', 'URL for the router server.', String, 'http://router-ttx')
  .option(
    '--timeout <timeout>',
    'The maximum amount of time we will wait for a request to finish, in seconds',
    Number,
    1200,
  )
  .parse(process.argv);

const isProd = process.env.NODE_ENV === 'production';

console.log('Starting up...');
console.log(isProd ? 'Production mode' : 'Dev mode');
console.log('Using routing server at', program.routerUrl);

const r5Router = new R5Router(program.routerUrl);

const app = express();

// Log all requests.
app.use(require('morgan')('dev'));

app.get('/healthy', (expressRequest, response) => {
  response.send('OK');
});

// Get step-by-step directions for a route between two points.
// Parameters are { origin: {lat, lng}, departureTime, destination: {lat, lng} }
app.get(
  '/route',
  wrapPromise(async (expressRequest, response) => {
    const params = parseRequestURL(expressRequest.url);
    const route = await r5Router.getRoute(params.origin, params.destination, params.options);
    if (isProd) {
        response.setHeader('Cache-Control', 'public, max-age=86400');
    }
    response.send(route);
  }),
);

// Get travel times from an origin to every dissemination area in the city.
// Parameters are { origin: {lat, lng}, departureTime }
app.get(
  '/one-to-city',
  wrapPromise(async (expressRequest, response) => {
    const params = parseRequestURL(expressRequest.url);
    const travelTimes = await r5Router.getTravelTimes(params.origin, params.options);
    if (isProd) {
        response.setHeader('Cache-Control', 'public, max-age=86400');
    }
    response.send(travelTimes);
  }),
);

/**
 * @param requestURL expressRequest url string
 */
function parseRequestURL(requestURL: string) {
  let parsedQuery = url.parse(requestURL).query;
  // The proxy server used at Sidewalk appends a '=' to the end of URLs, which causes JSON.parse
  // to fail.
  if (parsedQuery.slice(-1) === '=') {
    parsedQuery = parsedQuery.slice(0, -1);
  }
  return JSON.parse(decodeURIComponent(parsedQuery));
}

// In prod, cache all assets for 1 day. For development, don't do any caching.
const maxAge = process.env.NODE_ENV === 'production' ? '1d' : null;

app.use(
  gzipStatic(__dirname + '/../static', {
    maxAge,
  }),
);

const server = app.listen(program.port);
server.timeout = program.timeout * 1000;

console.log(`Listening on port ${program.port}`);
