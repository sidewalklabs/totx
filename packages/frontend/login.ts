/**
 * This modules installs express handlers relating to OAuth login via Firebase.
 */

import * as cookie from 'cookie';
import * as express from 'express';
import * as jsonwebtoken from 'jsonwebtoken';
import * as request from 'request';
import * as fbutil from '../utils/firebase';

export interface Settings {
  projectId: string;
}

// This will be the type of request.user for authenticated requests.
export interface UserProfile {
  provider: string;
  id: string;
  displayName: string;
  email: string;
  userId: string; // the bit before '@' in the email.
  userDomain: string; // the bit after '@' in the email.
  emailVerified: boolean;
}

const CERTIFICATE_URL =
  'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
let certificates: {[keyId: string]: string} | null = null;
let settings: Settings | null = null;

function fetchCertificates() {
  request.get(CERTIFICATE_URL, (error, response, body) => {
    if (error) {
      console.error('Unable to fetch certificates:', error);
      return;
    }
    certificates = JSON.parse(body);

    // Refresh the certificates when requested.
    const cacheDirectives: string[] = response.headers['cache-control'].split(', ');
    cacheDirectives.map(directive => {
      if (directive.indexOf('max-age') === 0) {
        const maxAge = parseInt(directive.split('=')[1], 10);
        setTimeout(fetchCertificates, maxAge * 1000);
      }
    });
  });
}

// Errors that we fire when authentication fails.
class AuthError {
  constructor(public message: string) {}
}

// Get the user's profile information from a JWT token, validating it along the way.
// In addition to returning this, we populate the 'request.user' field with it for later use.
// JWT tokens are signed, base64-encoded JSON objects containing user authentication information.
// Usually these are passed in 'Authorization' headers as Bearer tokens, but because we want to
// silently instrument the services we proxy, we can't add this header to every request on the
// client side.
// Instead, we pass the tokens we get from Firebase in a cookie named '_fbt' (for FireBase Token).
function decodeUserProfile(req: express.Request): UserProfile {
  if (!req.headers['cookie']) {
    throw new AuthError('No cookie header');
  }
  const cookies = cookie.parse(req.headers['cookie']);
  if (!cookies || !cookies['_fbt']) {
    throw new AuthError('No auth cookie');
  }
  const token = cookies['_fbt'];

  // Decode (but don't validate) the token. We need to do this before validating to get the 'kid'
  // field from the header, which tells us which key to use. We can also check on the issuer,
  // audience, token creation time, and token expiration time to ensure that the token is the kind
  // we're looking for.
  // See: https://firebase.google.com/docs/auth/admin/verify-id-tokens
  const {header, payload} = jsonwebtoken.decode(token, {complete: true}) as any;
  const {email, aud, iss, iat, exp, sub, name, email_verified} = payload;
  const nowSecs = Date.now() / 1000;
  if (iat > nowSecs) {
    throw new AuthError('Token in the future');
  }
  if (exp < nowSecs) {
    throw new AuthError('Token expired');
  }
  if (!settings) {
    throw new AuthError('Auth settings have not been initialized.');
  }
  if (
    aud !== settings.projectId ||
    iss !== 'https://securetoken.google.com/' + settings.projectId
  ) {
    throw new AuthError('Wrong token for project');
  }

  // Validate the token's signature using the key specified in the header (which must be one of
  // Google's keys that we fetch in fetchCertificates).
  const {kid} = header;
  const cert = certificates && certificates[kid];
  if (!cert) {
    throw new AuthError(`Bad JWT: key with ID ${kid} not found`);
  }

  // This will throw an exception if verification fails.
  try {
    jsonwebtoken.verify(token, cert);
  } catch (e) {
    throw new AuthError(e.message);
  }
  const [userId, userDomain] = email.split('@');
  const user: UserProfile = {
    provider: payload.firebase.sign_in_provider,
    id: sub,
    displayName: name,
    email,
    userId,
    userDomain,
    emailVerified: email_verified,
  };
  (req as any).user = user;
  return user;
}

export const authenticateUser: express.RequestHandler = (req, res, next) => {
  try {
    const {emailVerified} = decodeUserProfile(req);
    if (emailVerified) {
      return next();
    } else {
      return res.redirect('/auth/baddomain');
    }
  } catch (e) {
    if (!(e instanceof AuthError)) {
      res.status(500).send(`<p>Error occurred during authentication: ${e}</p>`);
      return;
    }
  }
  const url = '/auth?redirect=' + encodeURIComponent(req.url);
  return res.redirect(url);
};

// Install handlers for the static HTML+JS we use for our login flow.
function installHandlers(app: express.Application) {
  if (!settings) {
    throw new Error('installHandlers called with uninitialized settings!');
  }
  const {projectId} = settings;
  const firebaseConfig = fbutil.getFirebaseConfig(projectId);

  app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/static/login.html');
  });

  app.get('/auth', (req, res) => {
    res.sendFile(__dirname + '/static/auth.html');
  });

  // Server javascript for the Firebase login UI, which includes an inlined firebaseConfig.
  app.get('/firebase_config.js', (req, res) => {
    res.setHeader('Content-Type', 'text/javascript');
    res.writeHead(200);
    res.write(`
      var config = ${JSON.stringify(firebaseConfig)};
      firebase.initializeApp(config);
    `);
    res.end();
  });

  // Serve the raw firebase config, for use in frontends.
  app.get('/firebase_config.json', (req, res) => {
    res.json(firebaseConfig);
  });

  app.get('/logout', (req, res) => {
    res.sendFile(__dirname + '/static/logout.html');
  });

  app.get('/auth/baddomain', (req, res: express.Response) => {
    let email: string;
    try {
      email = decodeUserProfile(req).email;
    } catch (e) {
      res.send(`<p>Error encountered during authentication: ${e}</p>`);
      return;
    }
    res.send(`
        <p>You are signed in as <b>${email}</b>.</p>
        <p>You are not allowed to access this resource. Please contact the administrator or
        <a href='/logout'>sign out</a> and sign in using an authorized account.</p>`);
  });
}

/**
 * Install domain restriction via OAuth on an express application.
 *
 * The app must have express session storage available.
 */
export function install(app: express.Application, inSettings: Settings) {
  if (settings) {
    throw new Error('Installing domain restriction twice!');
  }
  settings = inSettings;
  fetchCertificates();
  installHandlers(app);
}
