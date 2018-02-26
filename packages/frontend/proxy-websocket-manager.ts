/**
 * This module provides a websocket passthrough for proxying traffic through this
 * server to another host.
 */

import * as express from 'express';
import * as http from 'http';
import * as ws from 'ws';

/**
 * Establish a proxied websocket connection.
 *
 * Given an opened connection to a client, this will attempt to open a socket
 * to the server in request.headers[Host] and then act as a passthrough.
 */
export function webSocketProxyHandler(socket: ws, request: http.IncomingMessage) {
  const host = request.headers['host'];
  const wsPath = `ws://${host}${request.url}`;
  const wsClient = new ws(wsPath);
  wsClient.on('open', () => {
    console.log(`opened socket to ${host}`);
  });
  wsClient.on('message', data => {
    socket.send(data);
  });

  socket.on('close', () => {
    console.log(`closed socket to ${host}`);
    wsClient.close();
  });

  socket.on('message', msg => {
    try {
      wsClient.send(msg);
    } catch (e) {
      console.error('error on websocket connections');
      console.error(e.stack);
      socket.close();
      wsClient.close();
    }
  });
}

/**
 * Sets up a websocket handler.
 *
 * This will listen on the same port as `app` for
 * websocket traffic. When socket is opened it will mock a GET-like request and response
 * with the headers and cookies from the connection request and run it through
 * the middlewares, allowing us to check for auth and user information. If the
 * middleware sends a 200, it will pass the new socket to the callback.
 */
export function registerWebSocketHandler(
  app: express.Express,
  options: {wsOptions: ws.IServerOptions},
  middlewares: express.RequestHandler[],
  callback: (socket: ws, request: http.IncomingMessage) => void,
): http.Server {
  const server = http.createServer();
  const wsServer = new ws.Server({server});

  server.on('request', app);

  wsServer.on('connection', (socket: ws, request: http.IncomingMessage) => {
    // Build a dummy "get" request so that we can reuse any and all middleware
    // kind of gnarly: the ServerResponse constructor is private so we have
    // to cast to `any`
    const dummyResponse: express.Response = new (http as any).ServerResponse(request);
    dummyResponse.redirect = () => {
      // XXX(stein): this can get slammed by a bad connection in some cases - when I
      // close the socket I've observed the browser trying to reestablish the connection
      // and winding up in a loop but I haven't dug into how to best mitigate. Since
      // we should already be logged in before we open a webhook I'm hoping this is an
      // edgecase we can ignore initially.
      socket.close();
      socket.terminate();
    };
    dummyResponse.writeHead = (statusCode: number) => {
      if (statusCode > 200) {
        console.warn(`middleware did not accept request - ${dummyResponse.get('host')}`);
        socket.close();
      }
    };

    // XXX(stein): Bear with me: this turns the incoming request, which
    // is an http.IncomingMessage into an express.Request by replacing the
    // prototype of the request, so we mutate `request` and `wrappedRequest`, but
    // changing the type of an object on the fly isn't super kosher in typescript.
    //
    // For justification on why this is OK see this changeset:
    //   https://github.com/expressjs/express/commit/6022567c754a8f1d0b117168b67324da7200fa3c
    // and also check out https://github.com/expressjs/express/blob/master/lib/request.js
    // to convince yourself that express.Request.prototype is a strict superset of
    // http.IncomingMessage.prototype
    const wrappedRequest: express.Request = request as any;
    Object.setPrototypeOf(wrappedRequest, app.request);

    // middleware typically takes a `next` argument that will move to the next piece of middleware
    // this emulates that by proceeding through middleware unless one of them does not call `next`
    let nextCalled = false;
    for (const middleware of middlewares) {
      nextCalled = false;
      const callNext = () => {
        nextCalled = true;
      };
      middleware(wrappedRequest, dummyResponse, callNext);
      if (!nextCalled) break;
    }
    if (nextCalled) {
      callback(socket, request);
    }
  });

  return server;
}
