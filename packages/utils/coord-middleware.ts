import * as compression from 'compression';
import * as express from 'express';
import * as login from '../frontend/login';
import * as restriction from '../frontend/restriction';
import {httpsRedirect} from './https';

export interface Config {
  // The actual express app, required.
  app: express.Application;
  // Require that a user has logged in via firebase.
  requireAuthentication?: boolean;
  // Require that the logged in user is an internal user. This implies requireAuthentication.
  requireInternalUser?: boolean;
  // A list of paths that are exempt from authentication.
  authExemptPaths?: string[];
  // A custom /healthy handler to override the default.
  healthyHandler?: express.RequestHandler;
  // The canonical host for this server. If specified, will redirect to this host.
  canonicalHost?: string;
  // The project to use for firebase. Defaults to nyc-tlc-1225.
  projectId?: string;
}

// Conditionally require authentication on paths.
const authRedirect = (
  requireInternalUser?: boolean,
  unprotectedPaths?: string[],
): express.RequestHandler => {
  if (!unprotectedPaths) {
    unprotectedPaths = [];
  }
  unprotectedPaths.push('/healthy');
  return (request, response, next) => {
    // Skip authentication for unprotected paths.
    if (unprotectedPaths.indexOf(request.path) !== -1) {
      next();
      return;
    }
    login.authenticateUser(request, response, () => {
      if (requireInternalUser) {
        restriction.ensureCoord(request, response, next);
      } else {
        next();
      }
    });
  };
};

// Redirect insecure (http) requests to their https equivalent.
const canonicalHostRedirect = (canonicalHost: string): express.RequestHandler => (
  request,
  response,
  next,
) => {
  // Only trigger if the request is coming from the outside, so internal requests are okay.
  const isExternalRequest = !!request.get('via'); // 'via' means it came via a loadbalancer.
  if (isExternalRequest && request.hostname !== canonicalHost) {
    response.redirect(`https://${canonicalHost}${request.url}`); // url includes a leading '/'.
  } else {
    next();
  }
};

// Set the app up with common settings.
export function install(config?: Config) {
  const {app} = config;
  let {projectId} = config;
  if (!projectId) {
    projectId = 'nyc-tlc-1225';
  }
  login.install(config.app, {projectId});
  app.use(require('morgan')('dev'));
  app.use(compression());
  if (config.canonicalHost) {
    app.use(canonicalHostRedirect(config.canonicalHost));
  }
  app.use(httpsRedirect);

  if (config.requireAuthentication || config.requireInternalUser) {
    app.use(authRedirect(config.requireInternalUser, config.authExemptPaths));
  }

  let healthyHandler = config.healthyHandler;
  if (!healthyHandler) {
    healthyHandler = (_, response) => {
      response.send('OK');
    };
  }
  app.get('/healthy', healthyHandler);
}
