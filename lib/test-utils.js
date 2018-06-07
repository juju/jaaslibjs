/* Copyright (C) 2018 Canonical Ltd. */

'use strict';

const sinon = require('sinon');
const tap = require('tap');

const utils = require('./utils');


tap.test('_wrap', t => {
  t.autoend(true);

  t.test('returns a wrapped version of the supplied function', t => {
    const stub = sinon.stub();
    const wrapped = utils._wrap(stub);
    t.equal(typeof wrapped, 'function');
    t.notEqual(stub, wrapped);
    t.end();
  });

  const of = 'calls the original function';

  t.test(of + 'with error', t => {
    const stub = sinon.stub();
    utils._wrap(stub)('error');
    t.deepEqual(stub.args, [['error', null]]);
    t.end();
  });

  t.test(of + 'without response text', t => {
    const stub = sinon.stub();
    utils._wrap(stub)(null, {});
    t.deepEqual(stub.args, [[null, null]]);
    t.end();
  });

  t.test(of + 'without json parsed response', t => {
    const stub = sinon.stub();
    utils._wrap(stub)(null, {target: {responseText: '{"data": "data"}'}});
    t.deepEqual(stub.args, [[null, '{"data": "data"}']]);
    t.end();
  });

  t.test(of + 'with json parsed response', t => {
    const stub = sinon.stub();
    utils._wrap(stub, {parseJSON: true})(
      null, {target: {responseText: '{"data": "data"}'}});
    t.deepEqual(stub.args, [[null, {data: 'data'}]]);
    t.end();
  });

  t.test(of + 'when json parsing fails', t => {
    const stub = sinon.stub();
    utils._wrap(stub, {parseJSON: true})(
      null, {target: {responseText: '{"invalid "json}'}});
    t.equal(
      stub.args[0][0].message,
      'Unexpected token j in JSON at position 11');
    t.equal(stub.args[0][1], null);
    t.end();
  });
});

tap.test('serializeObject', t => {
  t.autoend(true);

  t.test('serializes an object', t => {
    t.equal(
      utils.serializeObject({
        'foo': 'bar',
        'baz': 'qux'
      }),
      'foo=bar&baz=qux');
    t.end();
  });

  t.test('serializes an empty object', t => {
    t.equal(
      utils.serializeObject({}),
      '');
    t.end();
  });
});

tap.test('_transformAuthObject', t => {
  t.autoend(true);

  t.test('calls supplied callback if error', t => {
    const stub = sinon.stub();
    utils._transformAuthObject(stub, 'error', 'data');
    t.deepEqual(stub.args, [['error', 'data']]);
    t.end();
  });

  t.test('calls the supplied callback if no data', t => {
    const cb = sinon.stub();
    utils._transformAuthObject(cb, null, null);
    t.deepEqual(cb.args[0], [null, null]);
    t.end();
  });

  t.test('lowercases data keys and calls supplied callback', t => {
    const stub = sinon.stub();
    utils._transformAuthObject(stub, null, {Upper: 'case', Keys: 'here'});
    t.deepEqual(stub.args, [[null, {upper: 'case', keys: 'here'}]]);
    t.end();
  });
});
