import * as compression from 'compression';
import * as express from 'express';

import {wrapPromise} from '../utils/express-promise';
import {httpsRedirect} from '../utils/https';
import * as login from './login';
import ProxyManager from './proxy-manager';
import * as proxyWebSocketManager from './proxy-websocket-manager';
import * as restriction from './restriction';

const program = require('commander');

program
  .version('1.0.0')
  .description('Sidewalk static content/auth/proxy frontend.')
  .option('-p, --port <port>', 'Port on which to serve traffic (default: 1337)', Number, 1337)
  .option(
    '-b, --bucket <bucket>',
    'Cloud storage bucket from which to serve (default: sidewalk-static)',
    String,
    'sidewalk-static',
  )
  .option(
    '--proxy-ttl-secs <proxy-ttl-secs>',
    'Number of seconds to cache proxy configurations (default: 300).',
    Number,
    300,
  )
  .option('--disable-oauth', 'Turn off OAuth. This should only be used for testing.')
  .option(
    '--timeout <timeout>',
    'The maximum amount of time we will wait for a request to finish, in seconds',
    Number,
    20 * 60,
  )
  .parse(process.argv);

const EXTERNAL_PROXY_DIR = 'proxy';
const HOSTS_DIR = 'hosts';

console.log('Starting up...');

const app = express();

// Log all requests.
app.use(require('morgan')('dev'));
app.use(compression());

const projectId = process.env.GCLOUD_PROJECT || 'nyc-tlc-1225';
const gcs = require('@google-cloud/storage')({
  projectId,
  // credentials come from the dev or GCE environment.
});
const bucket = gcs.bucket(program.bucket);

// This forwards various headers on behalf of a proxy.
// See https://expressjs.com/en/guide/behind-proxies.html
app.set('trust proxy', 1);

const expressNoop: express.RequestHandler = (req, res, next) => next();

let ensureValidUser: express.RequestHandler = expressNoop;
let authenticateUser: express.RequestHandler = expressNoop;
let ensureSidewalk: express.RequestHandler = expressNoop;
if (!program.disableOauth) {
  login.install(app, {projectId});
  authenticateUser = login.authenticateUser;
  ensureValidUser = restriction.ensureDefaultDomains;
  ensureSidewalk = restriction.ensureSidewalk;
} else {
  console.warn('\nDANGER! RUNNING WITHOUT AUTHENTICATION!\n');
}

const proxyManager = new ProxyManager(bucket, EXTERNAL_PROXY_DIR, program.proxyTtlSecs);
const hostManager = new ProxyManager(bucket, HOSTS_DIR, program.proxyTtlSecs);

const handleProxyHostRequest: express.RequestHandler = (request, response) => {
  const {hostname, path} = request;
  hostManager.handleRequest(hostname, path, request, response);
};

// Path handlers go here.
app.get('/healthy', (request, response) => {
  response.send('OK');
});

// Match /internal/:name/:arbitrarily_long_path for all verbs.
app.all(
  /\/internal\/([^/]*)\/?(.*)/,
  httpsRedirect,
  authenticateUser,
  ensureValidUser,
  (request, response) => {
    const [name, path] = request.params;
    proxyManager.handleInternalRequest(name, path, request, response);
  },
);

// Match /proxy/:name/:arbitrarily_long_path for all verbs.
app.all(
  /\/proxy\/([^/]*)\/(.*)/,
  httpsRedirect,
  authenticateUser,
  ensureValidUser,
  (request, response) => {
    const [name, path] = request.params;
    proxyManager.handleRequest(name, path, request, response);
  },
);

// Reload host info (e.g. endpoint or allowed users/domains).
app.get(
  '/flushy',
  httpsRedirect,
  authenticateUser,
  ensureSidewalk,
  wrapPromise(async (request, response) => {
    const {hostname} = request;
    const proxyInfo = await hostManager.updateProxy(hostname);
    console.log('Reloaded proxy info for ', hostname, ': ', JSON.stringify(proxyInfo, null, '  '));
    response.send('DONE');
  }),
);

// GET requests can either be for static files or to proxied hosts.
app.get(/.*/, httpsRedirect, authenticateUser, handleProxyHostRequest);

// Match hostnames for proxying.
app.all(/.*/, httpsRedirect, authenticateUser, handleProxyHostRequest);

const server = proxyWebSocketManager.registerWebSocketHandler(
  app,
  {wsOptions: {}},
  [httpsRedirect, authenticateUser],
  proxyWebSocketManager.webSocketProxyHandler,
);

server.listen(program.port);
server.timeout = program.timeout * 1000;

console.log(`Listening on port ${program.port}`);
