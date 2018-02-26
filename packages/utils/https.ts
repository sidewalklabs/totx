import * as express from 'express';

// Redirect insecure (http) requests to their https equivalent.
export const httpsRedirect: express.RequestHandler = (request, response, next) => {
  // This header gets set by the Kubernetes Ingress.
  // This will not happen during local development.
  if (request.get('x-forwarded-proto') === 'http') {
    const host = request.get('host');
    const url = request.url;
    response.redirect(`https://${host}${url}`); // url includes a leading '/'.
  } else {
    next();
  }
};
