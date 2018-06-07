/* Copyright (C) 2018 Canonical Ltd. */

'use strict';

const sinon = require('sinon');
const tap = require('tap');

const bundleservice = require('./bundleservice');

tap.test('getBundleChangesFromYAML', t => {
  t.autoend(true);

  function setupFakes() {
    const sendPostRequest = sinon.stub();
    return {
      sendPostRequest,
      bundleService: new bundleservice(
        'http://you-are-el/', {sendPostRequest: sendPostRequest})
    };
  }

  t.test('makes a post request for the bundle changes', t => {
    const {bundleService, sendPostRequest} = setupFakes();
    const callback = sinon.stub();
    bundleService.getBundleChangesFromYAML('yaml', callback);
    const args = sendPostRequest.args[0];
    t.equal(args[0], 'http://you-are-el/bundlechanges/fromYAML');
    t.deepEqual(args[1], {'Content-type': 'application/json'});
    t.equal(args[2], '{"bundle":"yaml"}');
    t.equal(args[3], null);
    t.equal(args[4], null);
    t.equal(args[5], false);
    t.equal(args[6], null);
    t.equal(typeof args[7], 'function');
    // Call the handler
    args[7]({
      currentTarget: {
        response: '{"changes": "changes"}'
      }
    });
    t.deepEqual(callback.args[0], [null, 'changes']);
    t.end();
  });

  t.test('calls the callback with an error on bad response', t => {
    const {bundleService, sendPostRequest} = setupFakes();
    const callback = sinon.stub();
    bundleService.getBundleChangesFromYAML('yaml', callback);
    const args = sendPostRequest.args[0];
    t.equal(args[0], 'http://you-are-el/bundlechanges/fromYAML');
    t.deepEqual(args[1], {'Content-type': 'application/json'});
    t.equal(args[2], '{"bundle":"yaml"}');
    t.equal(args[3], null);
    t.equal(args[4], null);
    t.equal(args[5], false);
    t.equal(args[6], null);
    t.equal(typeof args[7], 'function');
    // Call the handler
    args[7]({
      currentTarget: {
        response: 'not json'
      }
    });
    t.deepEqual(
      callback.args[0],
      ['Unable to parse response data for bundle yaml', undefined]);
    t.end();
  });

});
