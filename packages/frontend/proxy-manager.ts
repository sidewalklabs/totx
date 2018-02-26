/**
 * Proxy HTTP requests as specified by files in a GCS bucket.
 *
 * For example, if gs://sidewalk-static/proxy/example contains "http://example.com",
 * then a request to /proxy/example/foo would be forwarded to "http://example.com/foo".
 */

import * as dns from 'dns';
import * as express from 'express';
import * as fs from 'fs';
import * as mime from 'mime';
import * as nodeCache from 'node-cache';
import * as request from 'request';
import * as url from 'url';

import {UserProfile} from './login';
import {checkValidUser, Restriction} from './restriction';

const streamToPromise = require('stream-to-promise');

// Forward request headers which match this regular expression.
const PROXY_HEADER_RE = /^(Accept-.*|User-Agent|Referer|Range|If-Modified-Since|Authorization|Cache-Control|Expect)$/i;

// Value to append to the HTTP "Via" header. Format is HTTP version + server name.
const PROXY_VIA = '1.1 static-gcs-server';

export interface ProxyInfo extends Restriction {
  // Only one of endpointUrl or staticDirectory should be set for any host.
  // The full url to proxy. Example: http://foo.bar.com/path?param=123
  endpointUrl?: string;
  // Directory in sidewalk-static GCS bucket from which to serve static content for this host.
  staticDirectory?: string;

  // Whether to forward user ID info (from oauth) to the endpoint, via custom X-headers.
  // This shouldn't be set to true for external proxies.
  forwardIdentity: boolean;
  // Whether to force all responses from the proxied endpoints to return headers instructing
  // the browser to only allow requests from the same origin.
  ensureSameOrigin: boolean;
  loadedTimeMs?: number;
}

/** Convert a ReadStream to a string. */
function streamToString(stream: fs.ReadStream): Promise<string> {
  return streamToPromise(stream).then((buffer: Buffer) => buffer.toString());
}

/** Returns a new set of headers to be used in the proxied request. */
function proxyHeaders(headers: {[key: string]: string}): {[key: string]: string} {
  const newHeaders: {[key: string]: string} = {};
  for (const header in headers) {
    if (!PROXY_HEADER_RE.test(header)) continue;
    newHeaders[header] = headers[header];
  }
  newHeaders['via'] = [PROXY_VIA].concat('via' in headers ? [headers['via']] : []).join(',');
  return newHeaders;
}

/** Join two paths with a slash, even if a ends with a slash or b starts with one. */
function slashJoin(a: string, b: string): string {
  const aNoSlash = a.slice(-1) === '/' ? a.slice(0, -1) : a;
  const bNoSlash = b[0] === '/' ? b.slice(1) : b;
  return `${aNoSlash}/${bNoSlash}`;
}

class ProxyManager {
  private proxies: {[name: string]: ProxyInfo};
  private serviceToPortCache: nodeCache;

  /**
   * Configurations will be found in gs://<bucket>/<directory>/...
   */
  constructor(private bucket: any, private directory: string, private ttlSeconds: number) {
    this.proxies = {};
    this.serviceToPortCache = new nodeCache({
      stdTTL: this.ttlSeconds,
    });
  }

  /** Reload a proxy spec from GCS. */
  async updateProxy(name: string): Promise<ProxyInfo> {
    const loadStartMs = Date.now();
    const readStream = this.bucket.file(`${this.directory}/${name}`).createReadStream();
    const content = await streamToString(readStream);
    const spec = JSON.parse(content);
    const info = {
      forwardIdentity: false,
      ensureSameOrigin: false,
      loadedTimeMs: Date.now(),
      ...spec,
    };
    this.proxies[name] = info;
    const loadEndMs = Date.now();
    console.log(`Loaded config for ${name} from GCS in ${loadEndMs - loadStartMs}ms.`);
    return info;
  }

  /** Get proxy info either from cache or GCS. */
  private async getProxy(name: string): Promise<ProxyInfo> {
    const proxyInfo = this.proxies[name];
    if (proxyInfo && Date.now() - proxyInfo.loadedTimeMs < this.ttlSeconds * 1000) {
      return proxyInfo;
    }
    return this.updateProxy(name);
  }

  private proxyResponse(
    proxyInfo: ProxyInfo,
    path: string,
    expressRequest: express.Request,
    response: express.Response,
  ) {
    const headers = proxyHeaders(expressRequest.headers);
    if (proxyInfo.forwardIdentity) {
      // These properties come from restrict-domain.
      // If needed, we could also get properties like id and displayName.
      const user = (expressRequest as any).user as UserProfile;
      const {userId, userDomain} = user;
      headers['From'] = `${userId}@${userDomain}`;
    }
    if (proxyInfo.ensureSameOrigin) {
      // Remove unsafe headers.
      delete headers['Access-Control-Allow-Origin'];
      // Don't allow frame-embeds.
      headers['X-Frame-Options'] = 'SAMEORIGIN';
    }
    // expressRequest.query is often truncated. Here we parse it ourselves to make sure the full
    // query string is passed through the proxy.
    expressRequest.query = url.parse(expressRequest.url, true).query;
    const options: request.Options = {
      headers,
      url: slashJoin(proxyInfo.endpointUrl, path),
      qs: expressRequest.query,
      body: expressRequest,
      method: expressRequest.method,
      followRedirect: false, // redirects should be handled by the browser, not the proxy server.
    };
    request(options)
      .on('error', (error: any) => {
        if (error.code === 'ENOTFOUND') {
          response.status(404).send(`Host: ${error.host} could not be found on port ${error.port}`);
        } else if (error.code === 'ETIMEDOUT') {
          response.status(404).send(`Host: ${error.host} did not respond on port ${error.port}`);
        } else {
          response.status(500).send(`Error processing request: ${error}`);
        }
      })
      .pipe(response);
  }

  private handleStaticRequest(
    proxyInfo: ProxyInfo,
    path: string,
    expressRequest: express.Request,
    response: express.Response,
  ) {
    if (path.slice(-1) === '/') {
      path += 'index.html';
    }

    // TODO: get this information from the GCS file metadata.
    const mimeType = mime.lookup(path);
    const charset = mime.charsets.lookup(mimeType);
    const contentType = mimeType + (charset ? '; charset=' + charset : '');

    path = proxyInfo.staticDirectory + path; // path includes a leading slash.
    if (path[0] === '/') {
      path = path.slice(1); // GCS gets confused by a leading slash.
    }

    let sentHeader = false;
    const stream = this.bucket.file(path).createReadStream();

    // TODO: Use stream.pipe()?
    stream.on('data', (data: Buffer) => {
      if (!sentHeader) {
        response.setHeader('Content-Type', contentType);
        sentHeader = true;
      }
      response.write(data);
    });

    stream.on('end', () => {
      response.end();
    });

    stream.on('error', (error: any) => {
      const code = error.code || 500;
      response.status(code).send(error);
    });
  }

  private lookupPort(qualifiedServiceName: string, namedPort: string): Promise<number> {
    // Kubernetes uses DNS SRV records to record the mapping between named port and numbered port
    // set in the service yaml configurations. So, a service might export a port named 'http' that
    // actually maps to port 81, for example. Here, we structure a DNS lookup for the SRV record
    // associated with the service+namespace, for the port name that was passed in (namedPort) and
    // return the numerical port that is actually stored in DNS.
    // https://github.com/kubernetes/kubernetes/blob/master/build/kube-dns/README.md#srv-records
    return new Promise((resolve, reject) => {
      const cachedPort = this.serviceToPortCache.get<number>(qualifiedServiceName);
      if (cachedPort) {
        // If the port was found in the cache, use it!
        resolve(cachedPort);
      } else {
        const srvRecordName = `_${namedPort}._tcp.${qualifiedServiceName}.svc.cluster.local`;
        dns.resolveSrv(srvRecordName, (err, records: any[]) => {
          // Default to port 80.
          let port = 80;
          if (!err && records.length > 0) {
            port = records[0].port;
          }
          // Cache this for future requests.
          this.serviceToPortCache.set(qualifiedServiceName, port);
          resolve(port);
        });
      }
    });
  }

  private proxyInternalService(
    qualifiedServiceName: string,
    port: number,
    path: string,
    expressRequest: express.Request,
    response: express.Response,
  ) {
    const proxyInfo = {
      // Note that we include the .svc.cluster.local suffix to prevent accessing any domain names
      // outside of the cluster.
      endpointUrl: `http://${qualifiedServiceName}.svc.cluster.local:${port}`,
      forwardIdentity: true,
      ensureSameOrigin: true,
    };
    this.proxyResponse(proxyInfo, path, expressRequest, response);
  }

  async handleRequest(
    proxyName: string,
    path: string,
    expressRequest: express.Request,
    response: express.Response,
  ) {
    try {
      const proxyInfo = await this.getProxy(proxyName);
      const user = (expressRequest as any).user as UserProfile;
      const {email, userDomain} = user;
      if (!checkValidUser(proxyInfo, email, userDomain)) {
        response.redirect('/auth/baddomain');
        return;
      }
      if (proxyInfo.endpointUrl) {
        this.proxyResponse(proxyInfo, path, expressRequest, response);
      } else if (proxyInfo.staticDirectory !== undefined) {
        // staticDirectory can be '', which is falsy.
        this.handleStaticRequest(proxyInfo, path, expressRequest, response);
      } else {
        response.status(500).send(`Invalid host configuration for ${proxyName}:
          ${JSON.stringify(proxyInfo, null, 2)}
          Must specify either endpointUrl or staticDirectory`);
      }
    } catch (error) {
      const code = error.code || 500;
      const message = error.toString();
      response.status(code).send(`Request for invalid proxy ${proxyName}: ${message}`);
    }
  }

  async handleInternalRequest(
    service: string,
    path: string,
    expressRequest: express.Request,
    response: express.Response,
  ) {
    const serviceRegex = /([^.:]+)\.?([^:]*):?(.*)/;
    const matches = service.match(serviceRegex);

    if (!matches) {
      response.status(400).send('Service name not provided.');
      return;
    }

    const serviceName = matches[1];
    const namespace = matches[2] || 'default';
    const suppliedPort = matches[3] || 'http';
    const qualifiedServiceName = `${serviceName}.${namespace}`;

    // See if a numbered port was provided and use that if provided. Otherwise, look up the port.
    const numberedPort = Number(suppliedPort);
    const port = isNaN(numberedPort)
      ? await this.lookupPort(qualifiedServiceName, suppliedPort)
      : numberedPort;
    this.proxyInternalService(qualifiedServiceName, port, path, expressRequest, response);
  }
}

export default ProxyManager;
