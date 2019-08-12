/* Copyright (C) 2018 Canonical Ltd. */

'use strict';

const sinon = require('sinon');
const tap = require('tap');

const charmstore = require('./charmstore');

function setupFakes(options) {
  const bakery = {
    get: sinon.stub(),
    put: sinon.stub()
  };
  return {
    charmstoreInstance: new charmstore.charmstore('local/', bakery)
  };
}

tap.test('can be instantiated with the proper config values', t => {
  const {charmstoreInstance} = setupFakes();
  t.strictEqual(charmstoreInstance.url, 'local/v5');
  t.end();
});

tap.test('is smart enough to handle missing trailing slash in URL', t => {
  const charmstoreInstance = new charmstore.charmstore('http://example.com', {});
  t.strictEqual(charmstoreInstance.url, 'http://example.com/v5');
  t.end();
});

tap.test('_generatePath', t => {
  t.autoend(true);

  t.test('generates a valid url using provided args', t => {
    const {charmstoreInstance} = setupFakes();
    const path = charmstoreInstance._generatePath('search/', 'text=foo');
    t.equal(path, 'local/v5/search/?text=foo');
    t.end();
  });
});

tap.test('getLogoutUrl', t => {
  t.autoend(true);

  t.test('returns a valid logout url', t => {
    const {charmstoreInstance} = setupFakes();
    const path = charmstoreInstance.getLogoutUrl();
    t.equal(path, 'local/v5/logout');
    t.end();
  });
});

tap.test('_transformQueryResults', t => {
  t.autoend(true);

  const data = {
    Results: [
      { entityType: 'charm', id: 'cs:precise/foo',
        Id: 'cs:precise/foo',
        Meta: { 'extra-info': { 'bzr-owner': ''}}},
      { entityType: 'charm', id: 'cs:~charmers/precise/foo',
        Id: 'cs:~charmers/precise/foo',
        Meta: { 'extra-info': { 'bzr-owner': 'charmers'}}},
      { entityType: 'charm', id: 'cs:~juju-gui-charmers/precise/foo',
        Id: 'cs:~juju-gui-charmers/precise/foo',
        Meta: { 'extra-info': { 'bzr-owner': 'juju-gui-charmers'}}},
      { entityType: 'bundle', id: 'cs:bundle/foo',
        Id: 'cs:bundle/foo',
        Meta: { 'extra-info': { 'bzr-owner': ''}}}
    ]};

  t.test('calls to process query response data for each record', t => {
    const {charmstoreInstance} = setupFakes();
    const cb = sinon.stub();
    const process = sinon.stub(charmstoreInstance, '_processEntityQueryData');
    charmstoreInstance._transformQueryResults(cb, null, data);
    t.equal(process.callCount, 4);
    t.equal(cb.callCount, 1);
    t.end();
  });

  t.test('can use a processing function to massage data', t => {
    const {charmstoreInstance} = setupFakes();
    const cb = sinon.stub();
    charmstoreInstance._processEntityQueryData = function(entity) {
      return entity;
    };
    charmstoreInstance.processEntity = function(data) {
      if (data.entityType === 'charm') {
        return 'It\'s a charm.';
      } else {
        return 'It\'s a bundle.';
      }
    };
    charmstoreInstance._transformQueryResults(cb, null, data);
    const models = cb.lastCall.args[1];
    t.equal(models[0], 'It\'s a charm.');
    t.equal(models[1], 'It\'s a charm.');
    t.equal(models[2], 'It\'s a charm.');
    t.equal(models[3], 'It\'s a bundle.');
    t.equal(cb.callCount, 1);
    t.end();
  });

  t.test('errors when no data is provided even if there is no error', t => {
    const {charmstoreInstance} = setupFakes();
    const cb = sinon.stub();
    charmstoreInstance._transformQueryResults(cb, null, null);
    t.equal(
      cb.args[0][0],
      'no entity data returned, can you access the charmstore?');
    t.equal(cb.callCount, 1);
    t.end();
  });
});

tap.test('_lowerCaseKeys', t => {
  t.autoend(true);

  t.test('can recursively transform an objects keys to lowercase', t => {
    const {charmstoreInstance} = setupFakes();
    const uppercase = { Baz: '1', Foo: { Bar: { Baz: '1' }}};
    const host = {};
    charmstoreInstance._lowerCaseKeys(uppercase, host);
    t.deepEqual(host, { baz: '1', foo: { bar: { baz: '1'}}});
    t.end();
  });

  t.test('can skip one level of keys in an object', t => {
    const {charmstoreInstance} = setupFakes();
    const uppercase = { Baz: '1', Foo: { Bar: { Baz: '1' }}, Fee: '2'};
    const host = {};
    charmstoreInstance._lowerCaseKeys(uppercase, host, 0);
    t.deepEqual(host, { Baz: '1', Foo: { bar: { baz: '1'}}, Fee: '2'});
    t.end();
  });
});

tap.test('_processEntityQueryData', t => {
  t.autoend(true);

  t.test('can properly transform v5 charm data', t => {
    const {charmstoreInstance} = setupFakes();
    const data = {
      Id: 'cs:trusty/mongodb-9',
      Meta: {
        'charm-metadata': {
          Name: 'mongodb',
          Provides: {
            db: {
              'Name': 'db',
              'Role': 'requirer',
              'Interface': 'mongo',
              'Optional': false,
              'Limit': 1,
              'Scope': 'global'
            }
          }
        },
        'owner': {
          User: 'hatch'
        },
        'extra-info': {
          'bzr-url': 'cs:precise/mongodb',
          supported: 'true',
          price: '8',
          description: 'supported description'
        },
        'charm-config': {
          Options: {
            'foo-optn': {
              Default: 'foo',
              Description: 'foo is awesome',
              Type: 'String'
            },
            'barOptn': {
              Default: 'bar',
              Description: 'bar is less awesome',
              Type: 'String'
            }
          }
        },
        'charm-metrics': {
          Metrics: {
            metric: 'metric'
          }
        },
        published: {Info: [
          {Channel: 'stable', Current: true},
          {Channel: 'edge', Current: false}
        ]},
        stats: {
          ArchiveDownloadCount: 10
        },
        tags: {
          Tags: ['ops', 'misc']
        },
        'supported-series': {
          SupportedSeries: [
            'precise',
            'trusty'
          ]
        }
      }
    };
    const processed = charmstoreInstance._processEntityQueryData(data);
    t.deepEqual(processed, {
      id: 'cs:trusty/mongodb-9',
      channels: [{
        name: 'stable', current: true
      }, {
        name: 'edge', current: false
      }],
      downloads: 10,
      entityType: 'charm',
      is_approved: true,
      is_subordinate: false,
      metrics: {
        metric: 'metric'
      },
      owner: 'hatch',
      supported: true,
      price: '8',
      supportedDescription: 'supported description',
      code_source: {
        location: 'cs:precise/mongodb'
      },
      name: 'mongodb',
      relations: {
        provides: {
          db: {
            'name': 'db',
            'role': 'requirer',
            'interface': 'mongo',
            'optional': false,
            'limit': 1,
            'scope': 'global'
          }
        },
        requires: {}
      },
      options: {
        'foo-optn': {
          'default': 'foo',
          description: 'foo is awesome',
          type: 'String'
        },
        'barOptn': {
          'default': 'bar',
          description: 'bar is less awesome',
          type: 'String'
        }
      },
      series: ['precise', 'trusty'],
      tags: ['ops', 'misc']
    });
    t.end();
  });

  t.test('handles missing extra-info data', t => {
    const {charmstoreInstance} = setupFakes();
    const data = {
      Id: 'cs:trusty/mongodb-9',
      Meta: {
        'charm-metadata': {
          Name: 'mongodb',
          Provides: {}
        },
        'extra-info': {},
        'charm-config': {Options: {}},
        stats: {ArchiveDownloadCount: 42}
      }
    };
    const processed = charmstoreInstance._processEntityQueryData(data);
    t.strictEqual(processed.owner, undefined);
    t.strictEqual(processed.code_source.location, undefined);
    t.end();
  });

  t.test('can properly transform v4 bundle data', t => {
    const {charmstoreInstance} = setupFakes();
    const data = {
      Id: 'cs:~charmers/bundle/mongodb-cluster-4',
      Meta: {
        'bundle-metadata': {
          'Services': ''
        },
        'bundle-unit-count': {
          'Count': 7
        },
        owner: {
          User: 'hatch'
        },
        'extra-info': {
          'bzr-url': 'lp:~charmers/charms/bundles/mongodb-cluster/bundle',
          supported: 'true',
          price: '8',
          description: 'supported description'
        },
        stats: {
          ArchiveDownloadCount: 10
        }
      }
    };
    const processed = charmstoreInstance._processEntityQueryData(data);
    t.deepEqual(processed, {
      code_source: {
        location: 'lp:~charmers/charms/bundles/mongodb-cluster/bundle'
      },
      channels: [],
      deployerFileUrl: 'local/v5/~charmers/bundle/mongodb-cluster-4/' +
          'archive/bundle.yaml',
      description: '',
      downloads: 10,
      entityType: 'bundle',
      id: 'cs:~charmers/bundle/mongodb-cluster-4',
      is_approved: false,
      name: 'mongodb-cluster',
      owner: 'hatch',
      services: '',
      supported: true,
      price: '8',
      supportedDescription: 'supported description',
      tags: [],
      unitCount: 7
    });
    t.end();
  });
});

tap.test('search', t => {
  t.autoend(true);

  t.test('accepts custom filters & calls to generate an api path', t => {
    const {charmstoreInstance} = setupFakes();
    const generatePath = sinon.stub(charmstoreInstance, '_generatePath').returns('path');
    charmstoreInstance.search({ text: 'foo' });
    t.equal(generatePath.callCount, 1, 'generatePath not called');
    t.deepEqual(generatePath.lastCall.args, [
      'search',
      'text=foo&' +
          'limit=30&' +
          'autocomplete=1&' +
          'include=charm-metadata&' +
          'include=supported-series&' +
          'include=bundle-metadata&' +
          'include=extra-info&' +
          'include=owner']);
    t.end();
  });

  t.test('accepts a custom limit when generating an api path', t => {
    const {charmstoreInstance} = setupFakes();
    const generatePath = sinon.stub(charmstoreInstance, '_generatePath').returns('path');
    charmstoreInstance.search({ text: 'foo' }, null, 99);
    t.equal(generatePath.callCount, 1, 'generatePath not called');
    t.deepEqual(generatePath.lastCall.args, [
      'search',
      'text=foo&' +
          'limit=99&' +
          'autocomplete=1&' +
          'include=charm-metadata&' +
          'include=supported-series&' +
          'include=bundle-metadata&' +
          'include=extra-info&' +
          'include=owner']);
    t.end();
  });

  t.test('calls to make a valid charmstore search request', t => {
    const {charmstoreInstance} = setupFakes();
    sinon.stub(charmstoreInstance, '_generatePath').returns('path');
    const transform = sinon.stub(charmstoreInstance, '_transformQueryResults');
    charmstoreInstance.search({}, 'cb');
    t.equal(
      charmstoreInstance.bakery.get.callCount, 1,
      'sendGetRequest not called');
    const requestArgs = charmstoreInstance.bakery.get.lastCall.args;
    const successCb = requestArgs[2];
    t.equal(requestArgs[0], 'path');
    // Call the success handler to make sure it's passed the callback.
    successCb({target: {responseText: '{}'}});
    t.equal(transform.lastCall.args[0], 'cb');
    t.end();
  });
});

tap.test('list', t => {
  t.autoend(true);

  t.test('accepts an author & calls to generate an api path', t => {
    const {charmstoreInstance} = setupFakes();
    const generatePath = sinon.stub(charmstoreInstance, '_generatePath').returns('path');
    charmstoreInstance.list('test-author', 'cb');
    t.equal(generatePath.callCount, 1, 'generatePath not called');
    t.deepEqual(generatePath.lastCall.args, [
      'list',
      'owner=test-author&' +
          'type=charm&' +
          'include=charm-metadata&' +
          'include=bundle-metadata&' +
          'include=bundle-unit-count&' +
          'include=bundle-machine-count&' +
          'include=common-info&' +
          'include=extra-info&' +
          'include=supported-series&' +
          'include=stats&' +
          'include=tags&' +
          'include=perm']);
    t.end();
  });

  t.test('can list bundles', t => {
    const {charmstoreInstance} = setupFakes();
    const generatePath = sinon.stub(charmstoreInstance, '_generatePath').returns('path');
    charmstoreInstance.list('test-author', 'cb', 'bundle');
    const qs = generatePath.lastCall.args[1];
    t.equal(qs.indexOf('type=bundle') > -1, true,
      'bundle not set in query string');
    t.end();
  });

  t.test('calls to make a valid charmstore list request', t => {
    const {charmstoreInstance} = setupFakes();
    sinon.stub(charmstoreInstance, '_generatePath').returns('path');
    const transform = sinon.stub(charmstoreInstance, '_transformQueryResults');
    charmstoreInstance.list('test-author', 'cb');
    t.equal(
      charmstoreInstance.bakery.get.callCount, 1,
      'sendGetRequest not called');
    const requestArgs = charmstoreInstance.bakery.get.lastCall.args;
    const successCb = requestArgs[2];
    t.equal(requestArgs[0], 'path');
    // Call the success handler to make sure it's passed the callback.
    successCb({target: {responseText: '{}'}});
    t.equal(transform.lastCall.args[0], 'cb');
    t.end();
  });
});

tap.test('getDiagramURL', t => {
  t.autoend(true);

  t.test('can generate a URL for a bundle diagram', t => {
    const {charmstoreInstance} = setupFakes();
    t.equal(charmstoreInstance.getDiagramURL('apache2'),
      'local/v5/apache2/diagram.svg');
    t.end();
  });
});

tap.test('getBundleYAML', t => {
  t.autoend(true);

  t.test('calls to get the bundle entity', t => {
    const {charmstoreInstance} = setupFakes();
    const cb = sinon.stub();
    const getEntity = sinon.stub(charmstoreInstance, 'getEntity');
    const response = sinon.stub(charmstoreInstance, '_getBundleYAMLResponse');
    const bundleId = 'bundle/elasticsearch';
    charmstoreInstance.getBundleYAML(bundleId, cb);
    const getEntityArgs = getEntity.lastCall.args;
    t.equal(getEntity.callCount, 1);
    t.equal(getEntityArgs[0], bundleId);
    getEntityArgs[1](); // Should be a bound copy of _getBundleYAMLResponse.
    // We need to make sure it's bound with the callback.
    const responseArgs = response.lastCall.args;
    responseArgs[0](); // Should be the callback.
    t.equal(cb.callCount, 1);
    t.end();
  });

  t.test('_getBundleYAMLResponse fetches yaml file contents', t => {
    const {charmstoreInstance} = setupFakes();
    const cb = sinon.stub();
    charmstoreInstance._getBundleYAMLResponse(
      cb, null, [{ deployerFileUrl: 'deployer file' }]);
    const requestArgs = charmstoreInstance.bakery.get.lastCall.args;
    t.equal(requestArgs[0], 'deployer file');
    // Should be the anon success callback handler.
    requestArgs[2](null, {
      target: {
        responseText: 'yaml'
      }
    });
    t.equal(cb.callCount, 1);
    t.equal(cb.lastCall.args[1], 'yaml');
    t.end();
  });
});

tap.test('getAvailableVersions', t => {
  t.autoend(true);

  t.test('makes a request to fetch the ids', t => {
    const {charmstoreInstance} = setupFakes();
    charmstoreInstance.getAvailableVersions('cs:precise/ghost-5');
    t.equal(charmstoreInstance.bakery.get.callCount, 1);
    t.end();
  });

  t.test('calls the success handler with a list of charm ids', t => {
    const {charmstoreInstance} = setupFakes();
    const cb = function(error, list) {
      // If it gets here then it has successfully called.
      if (error) {
        t.fail('callback should not fail.');
      }
      t.deepEqual(list, ['cs:precise/ghost-4']);
      t.end();
    };
    charmstoreInstance.getAvailableVersions('cs:precise/ghost-5', cb);
    const requestArgs = charmstoreInstance.bakery.get.lastCall.args;
    // The path should not have cs: in it.
    t.equal(requestArgs[0], 'local/v5/precise/ghost-5/expand-id');
    // Call the makeRequest success handler simulating a response object;
    requestArgs[2](null,
      {target: { responseText: '[{"Id": "cs:precise/ghost-4"}]'}});
  });

  t.test('calls the failure handler for json parse failures', t => {
    const {charmstoreInstance} = setupFakes();
    const cb = function(error, list) {
      if (error) {
        t.end();
      } else {
        t.fail('callback should not succeed.');
      }
    };
    charmstoreInstance.getAvailableVersions('cs:precise/ghost-5', cb);
    // Call the makeRequest success handler simulating a response object;
    charmstoreInstance.bakery.get.lastCall.args[2](null,
      {target: { responseText: '[notvalidjson]'}});
  });
});

tap.test('whoami', t => {
  t.autoend();

  t.test('queries who the current user is', t => {
    const {charmstoreInstance} = setupFakes();
    charmstoreInstance.whoami();
    t.equal(charmstoreInstance.bakery.get.callCount, 1);
    t.end();
  });

  t.test('calls the success handler with an auth object', t => {
    const {charmstoreInstance} = setupFakes();
    const cb = function(error, auth) {
      // If it gets here then it has successfully called.
      if (error) {
        t.fail('callback should not fail.');
      }
      t.deepEqual(auth, {user: 'test', groups: []});
      t.end();
    };
    charmstoreInstance.whoami(cb);
    const requestArgs = charmstoreInstance.bakery.get.lastCall.args;
    t.equal(requestArgs[0], 'local/v5/whoami');
    // Call the makeRequest success handler simulating a response object;
    requestArgs[2](null,
      {target: { responseText: '{"User": "test", "Groups": []}'}});
  });

  t.test('calls the failure handler for json parse failures', t => {
    const {charmstoreInstance} = setupFakes();
    const cb = function(error, list) {
      if (error) {
        t.end();
      } else {
        t.fail('callback should not succeed.');
      }
    };
    charmstoreInstance.whoami(cb);
    // Call the makeRequest success handler simulating a response object;
    charmstoreInstance.bakery.get.lastCall.args[2](
      {target: { responseText: '[notvalidjson]'}});
  });
});

tap.test('getCanonicalId', t => {
  t.autoend(true);

  t.test('makes a request to fetch the canonical id for an entity', t => {
    const {charmstoreInstance} = setupFakes();
    const callback = sinon.stub();
    charmstoreInstance.getCanonicalId('cs:xenial/ghost-4', callback);
    const bakeryGet = charmstoreInstance.bakery.get;
    t.equal(bakeryGet.callCount, 1);
    const requestPath = bakeryGet.args[0][0];
    t.equal(requestPath, 'local/v5/xenial/ghost-4/meta/id');
    // Call the success request callback
    bakeryGet.args[0][2](null, {
      target: {
        responseText: '{"Id": "cs:ghost"}'
      }
    });
    t.equal(callback.callCount, 1);
    t.deepEqual(callback.args[0], [null, 'cs:ghost']);
    t.end();
  });

  t.test('properly calls the callback when there is an error', t => {
    const {charmstoreInstance} = setupFakes();
    const callback = sinon.stub();
    charmstoreInstance.getCanonicalId('cs:xenial/ghost-4', callback);
    const bakeryGet = charmstoreInstance.bakery.get;
    t.equal(bakeryGet.callCount, 1);
    const requestPath = bakeryGet.args[0][0];
    t.equal(requestPath, 'local/v5/xenial/ghost-4/meta/id');
    // Call the error request callback.
    bakeryGet.args[0][2]('not found');
    t.equal(callback.callCount, 1);
    t.deepEqual(callback.args[0], ['not found', null]);
    t.end();
  });
});

tap.test('getEntity', t => {
  t.autoend(true);

  t.test('strips cs from bundle IDs', t => {
    const {charmstoreInstance} = setupFakes();
    charmstoreInstance.getEntity('cs:foobar', sinon.stub());
    const path = charmstoreInstance.bakery.get.lastCall.args[0];
    t.equal(path.indexOf('cs:'), -1,
      'The string "cs:" should not be found in the path');
    t.end();
  });

  t.test('calls the correct path', t => {
    const {charmstoreInstance} = setupFakes();
    charmstoreInstance.getEntity('cs:foobar', sinon.stub());
    const path = charmstoreInstance.bakery.get.lastCall.args[0];
    const expectedPath = (
      'local/v5/foobar/meta/any' +
      '?include=bundle-metadata' +
      '&include=bundle-machine-count' +
      '&include=charm-config' +
      '&include=charm-metadata' +
      '&include=charm-metrics' +
      '&include=common-info' +
      '&include=extra-info' +
      '&include=id-revision' +
      '&include=manifest' +
      '&include=owner' +
      '&include=published' +
      '&include=resources' +
      '&include=stats' +
      '&include=supported-series' +
      '&include=tags'
    );
    t.equal(path, expectedPath);
    t.end();
  });
});

tap.test('getResources', t => {
  t.autoend(true);

  t.test('can get resources for a charm', t => {
    const {charmstoreInstance} = setupFakes();
    const callback = sinon.stub();
    charmstoreInstance.getResources('cs:xenial/ghost-4', callback);
    const bakeryGet = charmstoreInstance.bakery.get;
    t.equal(bakeryGet.callCount, 1);
    const requestPath = bakeryGet.args[0][0];
    t.equal(requestPath, 'local/v5/xenial/ghost-4/meta/resources');
    // Call the success request callback
    bakeryGet.args[0][2](null, {
      target: {
        responseText: '[' +
          '{"Name":"file1","Type":"file","Path":"file1.zip","Description":' +
          '"desc.","Revision":5,"Fingerprint":"123","Size":168},' +
          '{"Name":"file2","Type":"file","Path":"file2.zip","Description":' +
          '"desc.","Revision":5,"Fingerprint":"123","Size":168}' +
          ']'
      }
    });
    t.equal(callback.callCount, 1);
    t.deepEqual(callback.args[0], [null, [{
      name: 'file1', type: 'file', path: 'file1.zip', description: 'desc.',
      revision: 5, fingerprint: '123', size: 168
    }, {
      name: 'file2', type: 'file', path: 'file2.zip', description: 'desc.',
      revision: 5, fingerprint: '123', size: 168
    }]]);
    t.end();
  });

  t.test('properly calls the callback when there is an error', t => {
    const {charmstoreInstance} = setupFakes();
    const callback = sinon.stub();
    charmstoreInstance.getResources('cs:xenial/ghost-4', callback);
    const bakeryGet = charmstoreInstance.bakery.get;
    t.equal(bakeryGet.callCount, 1);
    const requestPath = bakeryGet.args[0][0];
    t.equal(requestPath, 'local/v5/xenial/ghost-4/meta/resources');
    // Call the error request callback.
    bakeryGet.args[0][2]('not found');
    t.equal(callback.callCount, 1);
    t.deepEqual(callback.args[0], ['not found', null]);
    t.end();
  });
});
