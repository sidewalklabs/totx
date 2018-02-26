import * as express from 'express';
import * as fs from 'fs';
import * as path from 'path';
import * as request from 'request';
import * as _ from 'underscore';
import * as url from 'url';

import OTPRouter from './otp/otp';

const gzipStatic = require('connect-gzip-static');
const program = require('commander');

program
  .version('1.0.0')
  .description('Serve geographical data from a PostGIS database.')
  .option('-p, --port <port>', 'Port on which to serve traffic (default: 1337)', Number, 1337)
  .option('--router-url <url>', 'URL for the router server.', String, 'http://router')
  .option('--otp-endpoint <url>', 'Endpoint for OpenTripPlanner server', String)
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

let otpRouter: OTPRouter = null;
if (program.otpEndpoint) {
  console.log('Using OTP server at', program.otpEndpoint);
  otpRouter = new OTPRouter(program.otpEndpoint);
} else {
  console.log('OTP endpoint not configured; OpenTripPlanner routes will not be available.');
}

// Name of the PointSet loaded into OpenTripPlanner.
const OTP_POINTSET = 'nyc-bgs.locations';

// OpenTripPlanner uses numerical IDs whereas the router uses strings.
// We can map between them using the features list in the topojson file.
const OTP_IDS = (() => {
  const topojson = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'static', 'nyc-blockgroups.land.topojson'), 'utf-8'),
  );
  const geometries = topojson.objects['nyc-blockgroups.land'].geometries;
  return geometries.map((geometry: any) => geometry.properties.geo_id);
})();

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
    params = JSON.parse(decodeURIComponent(url.parse(expressRequest.url).query));
  } catch (e) {
    response.sendStatus(400);
    return;
  }

  if (isOtpRequest(params)) {
    return handleOtpOneToOne(params, response);
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

// Get travel times from an origin to every block group in NYC.
// Parameters are { origin: {lat, lng}, departureTime }
app.get('/one-to-nyc', (expressRequest, response) => {
  let params: any;
  try {
    params = JSON.parse(decodeURIComponent(url.parse(expressRequest.url).query));
  } catch (e) {
    response.sendStatus(400);
    return;
  }

  if (isOtpRequest(params)) {
    return handleOtpOneToMany(params, response);
  }

  params.destination = 'nycbgs';
  request({
    method: 'POST',
    url: program.routerUrl + '/one-to-preset',
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

function isOtpRequest(params: any) {
  // For now, send bicycle routes to the OTP backend.
  return params.options.mode === 'bicycle';
}

function handleOtpOneToOne(params: any, response: express.Response) {
  (async () => {
    const route = await otpRouter.getRoute(params.origin, params.destination, {
      ...params.options,
      mode: 'BICYCLE',
    });
    response.send(200, route);
  })().catch(e => {
    console.error(e);
    response.send(500, e);
  });
}

function handleOtpOneToMany(params: any, response: express.Response) {
  (async () => {
    const times = await otpRouter.getTravelTimes(params.origin, OTP_POINTSET, {
      ...params.options,
      mode: 'BICYCLE',
    });
    const idToTimes = _.object(OTP_IDS, times);
    response.send(200, idToTimes);
  })().catch(e => {
    console.error(e);
    response.send(500, e);
  });
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
