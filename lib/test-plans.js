/* Copyright (C) 2018 Canonical Ltd. */

'use strict';

const sinon = require('sinon');
const tap = require('tap');

const plans = require('./plans');

function makeXHRRequest(obj) {
  return {target: {responseText: JSON.stringify(obj)}};
};

tap.test('exists', t => {
  const bakery = {};
  const plansInstance = new plans.plans('http://1.2.3.4/', bakery);
  t.equal(plansInstance instanceof plans.plans, true);
  t.equal(
    plansInstance.url, 'http://1.2.3.4/' + plans.plansAPIVersion);
  t.end();
});

tap.test('is smart enough to handle missing trailing slash in URL', t => {
  const bakery = {};
  const plansInstance = new plans.plans('http://1.2.3.4', bakery);
  t.equal(
    plansInstance.url, 'http://1.2.3.4/' + plans.plansAPIVersion);
  t.end();
});

tap.test('lists plans for a charm', t => {
  const bakery = {
    get: function(url, headers, callback) {
      t.equal(
        url,
        'http://1.2.3.4/' +
        plans.plansAPIVersion +
        '/charm?charm-url=cs:juju-gui-42');
      const xhr = makeXHRRequest([{
        url: 'canonical-landscape/24-7',
        plan: '1',
        'created-on': '2016-06-09T22:07:24Z',
        description: 'Delivers the highest level of support.',
        model: {
          metrics: 'metric'
        },
        price: 'the/price'
      }, {
        url: 'canonical-landscape/8-5',
        plan: 'B',
        'created-on': '2016-06-09T22:07:24Z',
        description: 'Offers a high level of support.',
        model: {
          metrics: 'metric'
        },
        price: 'the/price'
      }, {
        url: 'canonical-landscape/free',
        plan: '9 from outer space',
        'created-on': '2015-06-09T22:07:24Z',
        description: 'No support available.',
        model: {
          metrics: 'metric'
        },
        price: 'Free'
      }]);
      callback(null, xhr);
    }
  };
  const plansInstance = new plans.plans('http://1.2.3.4/', bakery);
  plansInstance.listPlansForCharm('cs:juju-gui-42', function(error, plans) {
    t.equal(error, null);
    t.deepEqual(plans, [{
      url: 'canonical-landscape/24-7',
      yaml: '1',
      createdAt: new Date(1465510044000),
      description: 'Delivers the highest level of support.',
      metrics: 'metric',
      price: 'the/price'
    }, {
      url: 'canonical-landscape/8-5',
      yaml: 'B',
      createdAt: new Date(1465510044000),
      description: 'Offers a high level of support.',
      metrics: 'metric',
      price: 'the/price'
    }, {
      url: 'canonical-landscape/free',
      yaml: '9 from outer space',
      createdAt: new Date(1433887644000),
      description: 'No support available.',
      metrics: 'metric',
      price: 'Free'
    }]);
    t.end();
  });
});

tap.test('adds the charm schema prefix when listing plans', t => {
  const bakery = {
    get: function(url, headers, callback) {
      t.equal(
        url,
        'http://1.2.3.4/' +
        plans.plansAPIVersion +
        '/charm?charm-url=cs:django');
      const xhr = makeXHRRequest([]);
      callback(null, xhr);
    }
  };
  const plansInstance = new plans.plans('http://1.2.3.4/', bakery);
  plansInstance.listPlansForCharm('django', function(error, plans) {
    t.equal(error, null);
    t.end();
  });
});

tap.test('handles missing plans', t => {
  const bakery = {
    get: function(url, headers, callback) {
      const xhr = makeXHRRequest([]);
      callback(null, xhr);
    }
  };
  const plansInstance = new plans.plans('http://1.2.3.4/', bakery);
  plansInstance.listPlansForCharm('cs:juju-gui/42', function(error, plans) {
    t.equal(error, null);
    t.deepEqual(plans, []);
    t.end();
  });
});

tap.test('handles errors listing plans', t => {
  const bakery = {
    get: function(url, headers, callback) {
      const xhr = makeXHRRequest({error: 'bad wolf'});
      callback(null, xhr);
    }
  };
  const plansInstance = new plans.plans('http://1.2.3.4/', bakery);
  plansInstance.listPlansForCharm('django', function(error, plans) {
    t.equal(error, 'bad wolf');
    t.equal(plans, null);
    t.end();
  });
});

tap.test('retrieves the active plan for a given model and app', t => {
  const bakery = {
    get: function(url, headers, callback) {
      t.equal(
        url,
        'http://1.2.3.4/' +
        plans.plansAPIVersion +
        '/plan/model/uuid/service/app-name');
      const xhr = makeXHRRequest({
        'current-plan': 'canonical-landscape/free',
        'available-plans': {
          'canonical-landscape/8-5': {
            url: 'canonical-landscape/8-5',
            plan: 'B',
            'created-on': '2016-06-09T22:07:24Z',
            description: 'Offers a high level of support.',
            model: {
              metrics: 'metric'
            },
            price: 'the/price'
          },
          'canonical-landscape/free': {
            url: 'canonical-landscape/free',
            plan: '9 from outer space',
            'created-on': '2015-06-09T22:07:24Z',
            description: 'No support available.',
            model: {
              metrics: 'metric'
            },
            price: 'Free'
          }
        }
      });
      callback(null, xhr);
    }
  };
  const plansInstance = new plans.plans('http://1.2.3.4/', bakery);
  plansInstance.showActivePlan('uuid', 'app-name', function(error, current, all) {
    t.equal(error, null);
    t.deepEqual(current, {
      url: 'canonical-landscape/free',
      yaml: '9 from outer space',
      createdAt: new Date(1433887644000),
      description: 'No support available.',
      metrics: 'metric',
      price: 'Free'
    });
    t.deepEqual(all, [{
      url: 'canonical-landscape/8-5',
      yaml: 'B',
      createdAt: new Date(1465510044000),
      description: 'Offers a high level of support.',
      metrics: 'metric',
      price: 'the/price'
    }, {
      url: 'canonical-landscape/free',
      yaml: '9 from outer space',
      createdAt: new Date(1433887644000),
      description: 'No support available.',
      metrics: 'metric',
      price: 'Free'
    }]);
    t.end();
  });
});

tap.test('does not request active plans if no modelUUID is provided', t => {
  const bakery = {
    get: function(url, headers, callback) {
      t.fail('request should not have been made');
    }
  };
  const plansInstance = new plans.plans('http://1.2.3.4/', bakery);
  const cb = sinon.stub();
  plansInstance.showActivePlan(undefined, 'app-name', cb);
  t.deepEqual(cb.args[0], [
    'no modelUUID provided, cannot fetch active plan',
    null,
    []
  ]);
  t.end();
});

tap.test('handles errors retrieving the currently active plan', t => {
  const bakery = {
    get: function(url, headers, callback) {
      const xhr = makeXHRRequest({error: 'bad wolf'});
      callback(null, xhr);
    }
  };
  const plansInstance = new plans.plans('http://1.2.3.4/', bakery);
  plansInstance.showActivePlan('uuid', 'app-name', function(error, current, all) {
    t.equal(error, 'bad wolf');
    t.equal(current, null);
    t.deepEqual(all, []);
    t.end();
  });
});

tap.test('calls to request an sla authorization', t => {
  const bakery = {
    post: function(url, headers, body, callback) {
      const xhr = makeXHRRequest({message: 'sla ok'});
      callback(null, xhr);
    }
  };
  const plansInstance = new plans.plans('http://1.2.3.4/', bakery);
  plansInstance.authorizeSLA('standard', 'modelUUID', 'bodydata', (error, slaData) => {
    t.equal(error, null);
    t.equal(slaData, '{"message":"sla ok"}');
    t.end();
  });
});

tap.test('handles authorizing a plan', t => {
  const bakery = {
    post: function(url, headers, body, callback) {
      t.equal(
        url,
        'http://1.2.3.4/' +
        plans.plansAPIVersion +
        '/plan/authorize');
      const xhr = makeXHRRequest({
        'look ma': 'I\'m a macaroon',
        'params': body
      });
      callback(null, xhr);
    }
  };
  const plansInstance = new plans.plans('http://1.2.3.4/', bakery);
  plansInstance.authorizePlan(
    'envUUID',
    'charmUrl',
    'applicationName',
    'planUrl',
    'budget',
    'limit',
    function(error, authz) {
      t.equal(error, null);
      t.equal(authz['look ma'], 'I\'m a macaroon');
      t.equal(authz.params,
        '{"env-uuid":"envUUID","charm-url":"charmUrl",' +
        '"service-name":"applicationName","plan-url":"planUrl",' +
        '"budget":"budget","limit":"limit"}');
      t.end();
    }
  );
});

tap.test('lists budgets', t => {
  const budgets = {
    'budgets': [{
      'owner': 'spinach',
      'budget': 'my-budget',
      'limit': 99,
      'allocated': 77,
      'unallocated': 22,
      'available': 22,
      'consumed': 55
    }],
    'total': {
      'limit': 999,
      'allocated': 777,
      'unallocated': 222,
      'consumed': 55,
      'available': 22
    }};
  const bakery = {
    get: function(url, headers, callback) {
      t.equal(
        url,
        'http://1.2.3.4/' +
        plans.plansAPIVersion +
        '/budget');
      const xhr = makeXHRRequest(budgets);
      callback(null, xhr);
    }
  };
  const plansInstance = new plans.plans('http://1.2.3.4/', bakery);
  plansInstance.listBudgets(function(error, data) {
    t.equal(error, null);
    t.deepEqual(data, budgets);
    t.end();
  });
});

tap.test('handles errors listing budgets', t => {
  const bakery = {
    get: function(url, headers, callback) {
      const xhr = makeXHRRequest({error: 'bad wolf'});
      callback(null, xhr);
    }
  };
  const plansInstance = new plans.plans('http://1.2.3.4/', bakery);
  plansInstance.listBudgets(function(error, data) {
    t.equal(error, 'bad wolf');
    t.equal(data, null);
    t.end();
  });
});

tap.test('handles adding a budget', t => {
  const bakery = {
    post: function(url, headers, body, callback) {
      t.equal(
        url,
        'http://1.2.3.4/' +
        plans.plansAPIVersion +
        '/budget');
      const xhr = makeXHRRequest({
        'auth': 'I\'m a macaroon',
        'params': body
      });
      callback(null, xhr);
    }
  };
  const plansInstance = new plans.plans('http://1.2.3.4/', bakery);
  plansInstance.createBudget(
    'budget',
    'limit',
    function(error, data) {
      t.equal(error, null);
      t.equal(data['auth'], 'I\'m a macaroon');
      t.equal(data.params, '{"budget":"budget","limit":"limit"}');
      t.end();
    }
  );
});

tap.test('handles errors when adding a budget', t => {
  const bakery = {
    post: function(url, headers, body, callback) {
      t.equal(
        url,
        'http://1.2.3.4/' +
        plans.plansAPIVersion +
        '/budget');
      const xhr = makeXHRRequest({error: 'bad wolf'});
      callback(null, xhr);
    }
  };
  const plansInstance = new plans.plans('http://1.2.3.4/', bakery);
  plansInstance.createBudget(
    'budget',
    'limit',
    function(error, data) {
      t.equal(error, 'bad wolf');
      t.end();
    }
  );
});

tap.test('requests to update a budget', t => {
  const bakery = {
    patch: function(url, headers, body, callback) {
      t.equal(
        url,
        'http://1.2.3.4/' +
        plans.plansAPIVersion +
        '/budget/budgetid');
      t.equal(body, '{"limit":"limit"}');
      const xhr = makeXHRRequest({ data: 'data' });
      callback(null, xhr);
    }
  };
  const plansInstance = new plans.plans('http://1.2.3.4/', bakery);
  plansInstance.updateBudget(
    'budgetid',
    'limit',
    function(error, data) {
      t.strictEqual(error, null);
      t.deepEqual(data, {data: 'data'});
      t.end();
    }
  );
});

tap.test('requests to remove a budget', t => {
  const bakery = {
    delete: function(url, headers, body, callback) {
      t.equal(
        url,
        'http://1.2.3.4/' +
        plans.plansAPIVersion +
        '/budget/budgetid');
      const xhr = makeXHRRequest({ data: 'data' });
      callback(null, xhr);
    }
  };
  const plansInstance = new plans.plans('http://1.2.3.4/', bakery);
  plansInstance.removeBudget(
    'budgetid',
    function(error, data) {
      t.strictEqual(error, null);
      t.deepEqual(data, {data: 'data'});
      t.end();
    }
  );
});

tap.test('requests to create an allocation', t => {
  const bakery = {
    post: function(url, headers, body, callback) {
      t.equal(
        url,
        'http://1.2.3.4/' +
        plans.plansAPIVersion +
        '/budget/budgetid/allocation');
      t.deepEqual(body,
        '{"services":["application"],"model":"model","limit":"limit"}');
      const xhr = makeXHRRequest({ data: 'data' });
      callback(null, xhr);
    }
  };
  const plansInstance = new plans.plans('http://1.2.3.4/', bakery);
  plansInstance.createAllocation(
    'budgetid',
    'application',
    'model',
    'limit',
    function(error, data) {
      t.strictEqual(error, null);
      t.deepEqual(data, {data: 'data'});
      t.end();
    }
  );
});

tap.test('requests to update allocations', t => {
  const bakery = {
    patch: function(url, headers, body, callback) {
      t.equal(
        url,
        'http://1.2.3.4/' +
        plans.plansAPIVersion +
        '/model/model/service/application/allocation');
      t.deepEqual(body, '{"limit":"limit"}');
      const xhr = makeXHRRequest({ data: 'data' });
      callback(null, xhr);
    }
  };
  const plansInstance = new plans.plans('http://1.2.3.4/', bakery);
  plansInstance.updateAllocation(
    'model',
    'application',
    'limit',
    function(error, data) {
      t.strictEqual(error, null);
      t.deepEqual(data, {data: 'data'});
      t.end();
    }
  );
});

tap.test('requests to remove allocations', t => {
  const bakery = {
    delete: function(url, headers, body, callback) {
      t.equal(
        url,
        'http://1.2.3.4/' +
        plans.plansAPIVersion +
        '/environment/model/service/application/allocation');
      const xhr = makeXHRRequest({ data: 'data' });
      callback(null, xhr);
    }
  };
  const plansInstance = new plans.plans('http://1.2.3.4/', bakery);
  plansInstance.removeAllocation(
    'application',
    'model',
    function(error, data) {
      t.strictEqual(error, null);
      t.deepEqual(data, {data: 'data'});
      t.end();
    }
  );
});

tap.test('requests to update credit limits', t => {
  const bakery = {
    patch: function(url, headers, body, callback) {
      t.equal(
        url,
        'http://1.2.3.4/' +
        plans.plansAPIVersion +
        '/profile/user');
      t.deepEqual(body, '{"update":{"limit":"limit"}}');
      const xhr = makeXHRRequest({ data: 'data' });
      callback(null, xhr);
    }
  };
  const plansInstance = new plans.plans('http://1.2.3.4/', bakery);
  plansInstance.updateCreditLimit(
    'user',
    'limit',
    function(error, data) {
      t.strictEqual(error, null);
      t.deepEqual(data, {data: 'data'});
      t.end();
    }
  );
});

tap.test('requests to update default budget', t => {
  const bakery = {
    patch: function(url, headers, body, callback) {
      t.equal(
        url,
        'http://1.2.3.4/' +
        plans.plansAPIVersion +
        '/profile');
      t.deepEqual(body,
        '{"update":{"default-budget":"defaultBudget"}}');
      const xhr = makeXHRRequest({ data: 'data' });
      callback(null, xhr);
    }
  };
  const plansInstance = new plans.plans('http://1.2.3.4/', bakery);
  plansInstance.updateDefaultBudget(
    'defaultBudget',
    function(error, data) {
      t.strictEqual(error, null);
      t.deepEqual(data, {data: 'data'});
      t.end();
    }
  );
});

tap.test('gets budget details', t => {
  const budget = {
    'limit': 'budget limit',
    'total': {
      'allocated': 'total allocated amount',
      'available': 'unconsumed amount',
      'unallocated': 'unallocated amount',
      'usage': 'percentage of budget consumed',
      'consumed': 'total consumed amount'
    },
    'allocations': [{
      'owner': 'user, creator of allocation',
      'consumed': 'amount consumed',
      'limit': 'allocation limit',
      'usage': 'consumed/limit',
      'model': 'model uuid',
      'services': {
        'service name': {
          'consumed': 'consumed',
          'usage': 'consumed/allocation limit'
        }
      }
    }]
  };
  const bakery = {
    get: function(url, headers, callback) {
      t.equal(
        url,
        'http://1.2.3.4/' +
        plans.plansAPIVersion +
        '/budget/my-budget');
      const xhr = makeXHRRequest(budget);
      callback(null, xhr);
    }
  };
  const plansInstance = new plans.plans('http://1.2.3.4/', bakery);
  plansInstance.showBudget('my-budget', function(error, data) {
    t.equal(error, null);
    t.deepEqual(data, budget);
    t.end();
  });
});

tap.test('handles errors listing budgets', t => {
  const bakery = {
    get: function(url, headers, callback) {
      const xhr = makeXHRRequest({error: 'bad wolf'});
      callback(null, xhr);
    }
  };
  const plansInstance = new plans.plans('http://1.2.3.4/', bakery);
  plansInstance.showBudget('my-budget', function(error, data) {
    t.equal(error, 'bad wolf');
    t.equal(data, null);
    t.end();
  });
});

tap.test('handles adding a profile', t => {
  const bakery = {
    post: function(url, headers, body, callback) {
      t.equal(
        url,
        'http://1.2.3.4/' +
        plans.plansAPIVersion +
        '/profile');
      const xhr = makeXHRRequest({
        'auth': 'I\'m a macaroon',
        'response': 'profile saved'
      });
      callback(null, xhr);
    }
  };
  const plansInstance = new plans.plans('http://1.2.3.4/', bakery);
  plansInstance.createProfile(
    'user',
    'limit',
    'default-budget',
    'default-budget-limit',
    function(error, data) {
      t.equal(error, null);
      t.equal(data['auth'], 'I\'m a macaroon');
      t.equal(data.response, 'profile saved');
      t.end();
    }
  );
});

tap.test('handles errors when adding a budget', t => {
  const bakery = {
    post: function(url, headers, body, callback) {
      t.equal(
        url,
        'http://1.2.3.4/' +
        plans.plansAPIVersion +
        '/profile');
      const xhr = makeXHRRequest({error: 'bad wolf'});
      callback(null, xhr);
    }
  };
  const plansInstance = new plans.plans('http://1.2.3.4/', bakery);
  plansInstance.createProfile(
    'user',
    'limit',
    'default-budget',
    'default-budget-limit',
    function(error, data) {
      t.equal(error, 'bad wolf');
      t.end();
    }
  );
});

tap.test('gets kpi metrics for a charm', t => {
  const bakery = {
    get: function(url, headers, callback) {
      t.equal(url, 'http://1.2.3.4/' +
        plans.plansAPIVersion +
        '/metrics/kpi?charm-url=cs%3Ajuju-gui-42');
      const xhr = makeXHRRequest([{
        Metric: 'metric',
        Time: 't',
        Sum: 42,
        Count: 5,
        Min: 'min',
        Max: 'max'
      }, {
        Metric: 'bad-wolf',
        Time: 't',
        Sum: 53,
        Count: 8,
        Min: 'min',
        Max: 'max'
      }, {
        Metric: 'metric',
        Time: 't',
        Sum: 80,
        Count: 10,
        Min: 'min',
        Max: 'max'
      }]);
      callback(null, xhr);
    }
  };
  const plansInstance = new plans.plans('http://1.2.3.4/', bakery);
  plansInstance.getKpiMetrics('cs:juju-gui-42', {}, function(error, metrics) {
    t.equal(error, null);
    t.deepEqual(metrics, [{
      metric: 'metric',
      time: 't',
      sum: 42,
      count: 5,
      min: 'min',
      max: 'max'
    }, {
      metric: 'bad-wolf',
      time: 't',
      sum: 53,
      count: 8,
      min: 'min',
      max: 'max'
    }, {
      metric: 'metric',
      time: 't',
      sum: 80,
      count: 10,
      min: 'min',
      max: 'max'
    }]);
    t.end();
  });
});
