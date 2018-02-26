# Sidewalk Frontend

This is our Swiss-army-knife frontend/proxy. It does a bunch of different things:
  * Forces HTTPS on all incoming requests;
  * Ensures that all requests come from authenticated internal users using
    Firebase auth;
  * Serves static content from a GCS bucket;
  * Proxies requests to other internal services by hostname based on routing
    info stored in GCS.

## Running

To run locally:

    yarn frontend

## Testing

To test the hostname-based proxying locally, run both the frontend and
another service on a different port, e.g.:

    yarn develop frontend
    yarn develop motion-labeler -- --port=1338

Now write a JSON hosts file for a made-up URL to `gs://sidewalk-static/hosts`, e.g.:

    echo '{ "endpointUrl": "http://localhost:1338" }' | gsutil cp - gs://sidewalk-static/hosts/made-up-url.com

You'll need to fake a `Host` header. danvk had luck using the [requestly][] Chrome extension. Visit
localhost:1337 with the appropriate `Host` set and you'll get proxied content.

![requestly configuration](https://user-images.githubusercontent.com/98301/28094859-3f51f2ba-666d-11e7-8635-91dc2a8bf85a.png)

## Authentication Workflow

We authenticate users using a cookie named `_fbt` (for FireBase Token) that contains a [JWT][] we validate. But producing this cookie requires a client-side flow, so here's how we do it:

  1. User goes to page. We get JWT from cookie.
  1. If JWT is invalid, we redirect the user to `/auth`. Here, we populate the token based on the user's existing Firebase identity. The user could have a firebase identity but no JWT for a bunch of reasons, like if the token needs to be refreshed or if the user has never visited this domain before, so we haven't set the cookie. So in these cases, we redirect straight back to their original page.
  1. If `/auth` doesn't find a firebase identity, it redirects to `/login`. This is where we actually prompt the user to log in.
  1. When the login is finished, it redirects back to `/auth`, which sets the cookie, and *then* we go back to the original page.

[JWT]: https://jwt.io
[requestly]: https://chrome.google.com/webstore/detail/requestly-redirect-url-mo/mdnleldcmiljblolnjhpnblkcekpdkpa?hl=en
