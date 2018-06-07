/* Copyright (C) 2018 Canonical Ltd. */

'use strict';

const tap = require('tap');

const identity = require('./identity');

const baseURL = 'http://1.2.3.4';

function setupBakery(t, returnVal) {
  return {
    get: function(url, headers, callback) {
      t.equal(url, `${baseURL}/v1/u/hatch`);
      t.equal(headers, null);
      callback.apply(null, returnVal);
    }
  };
}

function setupUserStorage(returnVal) {
  return {
    identityURL: function() {
      return returnVal;
    }
  };
}

tap.test('getIdentityURL', t => {
  t.autoend(true);

  t.test('returns the identity url with the api version', t => {
    const bakery = setupBakery(t);
    const userStorage = setupUserStorage(baseURL);
    const identityInstance = new identity(userStorage, bakery);
    t.equal(identityInstance.getIdentityURL(), `${baseURL}/v1`);
    t.end();
  });

  t.test('returns null if no identity url is available', t => {
    const bakery = setupBakery(t);
    const userStorage = setupUserStorage(null);
    const identityInstance = new identity(userStorage, bakery);
    t.strictEqual(identityInstance.getIdentityURL(), null);
    t.end();
  });
});

tap.test('getUser', t => {
  t.autoend(true);

  t.test('calls back with the parsed data', t => {
    const userData = {user: 'data'};
    const returnVal = [null, {
      target: {
        responseText: JSON.stringify(userData)
      }
    }];
    const bakery = setupBakery(t, returnVal);
    const userStorage = setupUserStorage(baseURL);
    const identityInstance = new identity(userStorage, bakery);
    identityInstance.getUser('hatch', (err, data) => {
      t.deepEqual(data, userData);
      t.end();
    });
  });

  t.test('calls back with an error if the bakery request fails', t => {
    const returnVal = [{error: 'foo'}, null];
    const bakery = setupBakery(t, returnVal);
    const userStorage = setupUserStorage(baseURL);
    const identityInstance = new identity(userStorage, bakery);
    identityInstance.getUser('hatch', (err, data) => {
      t.deepEqual(err, returnVal[0]);
      t.end();
    });
  });

  t.test('calls back with an error if the json parsing fails', t => {
    const returnVal = [null, 'invalid'];
    const bakery = setupBakery(t, returnVal);
    const userStorage = setupUserStorage(baseURL);
    const identityInstance = new identity(userStorage, bakery);
    identityInstance.getUser('hatch', (err, data) => {
      t.deepEqual(
        err, 'TypeError: Cannot read property \'responseText\' of undefined');
      t.end();
    });
  });

  t.test('calls back with an error when no identity url is available', t => {
    const returnVal = [null, 'invalid'];
    const bakery = setupBakery(t, returnVal);
    const userStorage = setupUserStorage(null);
    const identityInstance = new identity(userStorage, bakery);
    identityInstance.getUser('hatch', (err, data) => {
      t.deepEqual(
        err, 'no identity URL available');
      t.end();
    });
  });

});
