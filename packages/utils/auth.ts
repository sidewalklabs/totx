import * as firebase from 'firebase/app';
import * as Cookies from 'js-cookie';
import * as _ from 'underscore';
require('firebase/auth');

/** Initializes Firebase with config loaded from the server. */
export async function initFirebase(instanceIdentifier?: string) {
  const response = await fetch(`/firebase_config.json`);
  const config = await response.json();
  return firebase.initializeApp(config, instanceIdentifier);
}

export async function authenticate(): Promise<firebase.User> {
  await initFirebase();
  return new Promise<firebase.User>(resolve => {
    firebase.auth().onAuthStateChanged((user: firebase.User) => {
      if (!user) {
        window.location.assign(`login?redirect=${encodeURIComponent(window.location.pathname)}`);
        return;
      }
      resolve(user);
    });
  });
}

export async function authedFetch(
  input: RequestInfo,
  init?: RequestInit,
  user?: firebase.User,
): Promise<Response> {
  const newInit = _.assign({headers: {}}, init);
  if (user) {
    const token = await user.getToken();
    newInit.headers['Authorization'] = `Bearer ${token}`;
  }
  return fetch(input, newInit);
}

/**
 * Refreshes the Firebase token and assigns it to the _fbt cookie
 * PRECONDITION: Firebase has been initialized with initFirebase()
 */
export async function refreshUserToken() {
  const currentUser = await firebase.auth().currentUser;
  if (!currentUser) return;

  // Passing true to getToken forces token to refresh
  const token = await currentUser.getToken(true);
  Cookies.set('_fbt', token);
}
