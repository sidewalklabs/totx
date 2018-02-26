/**
 * This module applies restrictions to express endpoints using user profiles.
 *
 * User profiles are obtained using OAuth -- see authentication.ts.
 */

import {RequestHandler} from 'express';

import {UserProfile} from './login';

export interface Restriction {
  // If specified, allow all authenticated users from these domains to access this host.
  // This overrides the default list of domains allowed by the Sidewalk frontend.
  allowedDomains?: string[];
  // If specified, also allow this list of users (email addresses) to access
  // this host. This is in addition to the domains specified in allowedDomains
  // or the default list of allowed domains. If you want to only allow a
  // whitelist of users, set allowedDomains to [].
  // These users will need to have Google accounts.
  allowedUsers?: string[];
}

/** By default, users from these domains are allowed to access all content. */
export const DEFAULT_DOMAINS = ['sidewalklabs.com', 'google.com', 'intersection.com'];

export const COORD_DOMAINS = ['sidewalklabs.com', 'coord.co'];

export const ensureDefaultDomains: RequestHandler = (request, res, next) => {
  const user = (request as any).user as UserProfile;
  const {userDomain} = user;
  if (DEFAULT_DOMAINS.indexOf(userDomain) !== -1) {
    next();
  } else {
    return res.redirect('/auth/baddomain');
  }
};

// Lock a request down to authenticated users on sidewalklabs.com
export const ensureSidewalk: RequestHandler = (request, response, next) => {
  const user = (request as any).user as UserProfile;
  const {userId, userDomain} = user;
  if (userDomain !== 'sidewalklabs.com') {
    console.warn('Blocked attempt by', userId, 'on host', request.hostname);
    response.status(403).write(`Unauthorized user ${userId}`);
  } else {
    next();
  }
};

export const ensureCoord: RequestHandler = (request, res, next) => {
  const user = (request as any).user as UserProfile;
  const {userDomain} = user;
  if (COORD_DOMAINS.indexOf(userDomain) !== -1) {
    next();
  } else {
    return res.redirect('/auth/baddomain');
  }
};

// Check whether a user is permitted according to the restriction.
export function checkValidUser(info: Restriction, email: string, userDomain: string): boolean {
  const domains = info.allowedDomains || DEFAULT_DOMAINS;
  const users = info.allowedUsers || [];
  return domains.indexOf(userDomain) >= 0 || users.indexOf(email) >= 0;
}
