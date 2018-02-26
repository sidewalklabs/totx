import {expect} from 'chai';
import {checkValidUser, Restriction} from './restriction';

describe('proxy-manager', () => {
  it('should use default domain restrictions', () => {
    expect(checkValidUser({}, '', 'dan.org')).to.be.false;
    expect(checkValidUser({}, '', 'gmail.com')).to.be.false;
    expect(checkValidUser({}, '', 'sidewalklabs.com')).to.be.true;
    expect(checkValidUser({}, '', 'intersection.com')).to.be.true;
    expect(checkValidUser({}, '', 'google.com')).to.be.true;
  });

  it('should prioritize per-host domain restrictions', () => {
    const restriction: Restriction = {allowedDomains: ['dan.org']};
    expect(checkValidUser(restriction, '', 'dan.org')).to.be.true;
    expect(checkValidUser(restriction, '', 'sidewalklabs.com')).to.be.false;
  });

  it('should support user-level permissions', () => {
    // The default whitelist of domains plus a single user on another domain.
    const restriction: Restriction = {allowedUsers: ['plant@dan.com']};
    expect(checkValidUser(restriction, 'vk@dan.com', 'dan.com')).to.be.false;
    expect(checkValidUser(restriction, 'plant@dan.com', 'dan.com')).to.be.true;
    expect(checkValidUser(restriction, '', 'gmail.com')).to.be.false;
    expect(checkValidUser(restriction, '', 'sidewalklabs.com')).to.be.true;
    expect(checkValidUser(restriction, '', 'intersection.com')).to.be.true;
    expect(checkValidUser(restriction, '', 'google.com')).to.be.true;
  });

  it('should support domain restrictions plus users', () => {
    const restriction: Restriction = {
      allowedDomains: ['dan.com'],
      allowedUsers: ['dan@sidewalklabs.com'],
    };
    expect(checkValidUser(restriction, 'vk@dan.com', 'dan.com')).to.be.true;
    expect(checkValidUser(restriction, 'plant@dan.com', 'dan.com')).to.be.true;
    expect(checkValidUser(restriction, '', 'gmail.com')).to.be.false;
    expect(checkValidUser(restriction, '', 'sidewalklabs.com')).to.be.false;
    expect(checkValidUser(restriction, '', 'intersection.com')).to.be.false;
    expect(checkValidUser(restriction, '', 'google.com')).to.be.false;
    expect(checkValidUser(restriction, 'dan@sidewalklabs.com', 'sidewalklabs.com')).to.be.true;
  });

  it('should support pure whitelists of users', () => {
    // Setting allowedDomains to an empty list overrides the default domains.
    const restriction: Restriction = {allowedDomains: [], allowedUsers: ['dan@sidewalklabs.com']};
    expect(checkValidUser(restriction, 'vk@dan.com', 'dan.com')).to.be.false;
    expect(checkValidUser(restriction, 'plant@dan.com', 'dan.com')).to.be.false;
    expect(checkValidUser(restriction, '', 'gmail.com')).to.be.false;
    expect(checkValidUser(restriction, '', 'sidewalklabs.com')).to.be.false;
    expect(checkValidUser(restriction, '', 'intersection.com')).to.be.false;
    expect(checkValidUser(restriction, '', 'google.com')).to.be.false;
    expect(checkValidUser(restriction, 'dan@sidewalklabs.com', 'sidewalklabs.com')).to.be.true;
  });
});
