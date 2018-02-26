"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var firebase = require("firebase/app");
var Cookies = require("js-cookie");
var _ = require("underscore");
require('firebase/auth');
/** Initializes Firebase with config loaded from the server. */
function initFirebase(instanceIdentifier) {
    return __awaiter(this, void 0, void 0, function () {
        var response, config;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetch("/firebase_config.json")];
                case 1:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 2:
                    config = _a.sent();
                    return [2 /*return*/, firebase.initializeApp(config, instanceIdentifier)];
            }
        });
    });
}
exports.initFirebase = initFirebase;
function authenticate() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, initFirebase()];
                case 1:
                    _a.sent();
                    return [2 /*return*/, new Promise(function (resolve) {
                            firebase.auth().onAuthStateChanged(function (user) {
                                if (!user) {
                                    window.location.assign("login?redirect=" + encodeURIComponent(window.location.pathname));
                                    return;
                                }
                                resolve(user);
                            });
                        })];
            }
        });
    });
}
exports.authenticate = authenticate;
function authedFetch(input, init, user) {
    return __awaiter(this, void 0, void 0, function () {
        var newInit, token;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    newInit = _.assign({ headers: {} }, init);
                    if (!user) return [3 /*break*/, 2];
                    return [4 /*yield*/, user.getToken()];
                case 1:
                    token = _a.sent();
                    newInit.headers['Authorization'] = "Bearer " + token;
                    _a.label = 2;
                case 2: return [2 /*return*/, fetch(input, newInit)];
            }
        });
    });
}
exports.authedFetch = authedFetch;
/**
 * Refreshes the Firebase token and assigns it to the _fbt cookie
 * PRECONDITION: Firebase has been initialized with initFirebase()
 */
function refreshUserToken() {
    return __awaiter(this, void 0, void 0, function () {
        var currentUser, token;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, firebase.auth().currentUser];
                case 1:
                    currentUser = _a.sent();
                    if (!currentUser)
                        return [2 /*return*/];
                    return [4 /*yield*/, currentUser.getToken(true)];
                case 2:
                    token = _a.sent();
                    Cookies.set('_fbt', token);
                    return [2 /*return*/];
            }
        });
    });
}
exports.refreshUserToken = refreshUserToken;
