import * as express from 'express';
import * as request from 'request';
import * as url from 'url';

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




const app = express();

// Log all requests.
app.use(require('morgan')('dev'));

app.get('/healthy', (expressRequest, response) => {
  response.send('OK');
});

// Get step-by-step directions for a route betwee two points.
// Parameters are { origin: {lat, lng}, departureTime, destination: {lat, lng} }
app.get('/route', (expressRequest, response) => {
  let params: any;
  try {
    params = parseRequestURL(expressRequest.url);
  } catch (e) {
    response.sendStatus(400);
    return;
  }

  request({
    method: 'POST',
    url: program.routerUrl + '/route',
    json: true,
    body: params,
  })
    .on('response', res => {
      if (isProd) {
        res.headers['Cache-Control'] = 'public, max-age=86400';
      }
    })
    .pipe(response);
});

// Get travel times from an origin to every block group in the city.
// Parameters are { origin: {lat, lng}, departureTime }
// This one works with the R5 router.
app.get('/one-to-city', (expressRequest, response) => {
  let params: any;
  try {
    params = parseRequestURL(expressRequest.url);
  } catch (e) {
    response.sendStatus(400);
    return;
  }

  params.destination = 'torontobgs';
  request({
    method: 'POST',
    url: program.routerUrl + '/travelTimeMap',
    json: true,
    body: params,
  })
    .on('response', res => {
      if (isProd) {
        res.headers['Cache-Control'] = 'public, max-age=86400';
      }
    })
    .pipe(response);
});

/**
 * Extract query params from request URL.
 * @param requestURL expressRequest url string
 */
function parseRequestURL(requestURL: string) {
  let parsedQuery = url.parse(requestURL).query;
  if (parsedQuery.substring(parsedQuery.length - 1, parsedQuery.length) === '=') {
    parsedQuery = parsedQuery.substring(0, parsedQuery.length - 1);
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