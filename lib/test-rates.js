/* Copyright (C) 2018 Canonical Ltd. */

'use strict';

const tap = require('tap');

const rates = require('./rates');

tap.test('exists', t => {
  const webHandler = {};
  const ratesInstance = new rates.rates('http://1.2.3.4/', webHandler);
  t.equal(ratesInstance.url, 'http://1.2.3.4/v3');
  t.end();
});

tap.test('can return the SLA machine rates', t => {
  const webHandler = {
    sendGetRequest: (url, headers, username, password,
      withCredentials, progressCallback, completedCallback) => {
      completedCallback({
        target: {
          responseText: JSON.stringify({
            unsupported: '0.000',
            essential: '0.011',
            standard: '0.055',
            advanced: '0.110'
          })
        }
      });
    }
  };
  const ratesInstance = new rates.rates('http://1.2.3.4/', webHandler);
  ratesInstance.getSLAMachineRates(data => {
    t.deepEqual(data, {
      unsupported: '0.000',
      essential: '0.011',
      standard: '0.055',
      advanced: '0.110'
    });
    t.end();
  });
});
