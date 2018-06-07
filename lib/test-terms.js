/* Copyright (C) 2018 Canonical Ltd. */

'use strict';

const sinon = require('sinon');
const tap = require('tap');

const terms = require('./terms');


function makeXHRRequest(obj) {
  return {target: {responseText: JSON.stringify(obj)}};
};


tap.test('exists', t => {
  const bakery = {};
  const termsInstance = new terms.terms('http://1.2.3.4/', bakery);
  t.equal(termsInstance instanceof terms.terms, true);
  t.equal(termsInstance.url, 'http://1.2.3.4/' + terms.termsAPIVersion);
  t.end();
});

tap.test('is smart enough to handle missing trailing slash in URL', t => {
  const bakery = {};
  const termsInstance = new terms.terms('http://1.2.3.4', bakery);
  t.equal(termsInstance.url, 'http://1.2.3.4/' + terms.termsAPIVersion);
  t.end();
});

tap.test('shows terms with revision', t => {
  const bakery = {
    get: function(url, headers, callback) {
      t.equal(
        url,
        'http://1.2.3.4/' +
        terms.termsAPIVersion +
        '/terms/canonical?revision=42');
      const xhr = makeXHRRequest([{
        name: 'canonical',
        owner: 'spinach',
        title: 'canonical terms',
        revision: 42,
        'created-on': '2016-06-09T22:07:24Z',
        content: 'Terms and conditions'
      }]);
      callback(null, xhr);
    }
  };
  const termsInstance = new terms.terms('http://1.2.3.4/', bakery);
  termsInstance.showTerms('canonical', 42, function(error, terms) {
    t.equal(error, null);
    t.deepEqual(terms, {
      name: 'canonical',
      owner: 'spinach',
      title: 'canonical terms',
      revision: 42,
      createdAt: new Date(1465510044000),
      content: 'Terms and conditions'
    });
    t.end();
  });
});

tap.test('shows most recent terms', t => {
  const bakery = {
    get: function(url, headers, callback) {
      t.equal(
        url,
        'http://1.2.3.4/' +
        terms.termsAPIVersion +
        '/terms/canonical');
      const xhr = makeXHRRequest([{
        name: 'canonical',
        owner: 'spinach',
        title: 'canonical recent terms',
        revision: 47,
        'created-on': '2016-06-09T22:07:24Z',
        content: 'Terms and conditions'
      }]);
      callback(null, xhr);
    }
  };
  const termsInstance = new terms.terms('http://1.2.3.4/', bakery);
  termsInstance.showTerms('canonical', null, function(error, terms) {
    t.equal(error, null);
    t.deepEqual(terms, {
      name: 'canonical',
      owner: 'spinach',
      title: 'canonical recent terms',
      revision: 47,
      createdAt: new Date(1465510044000),
      content: 'Terms and conditions'
    });
    t.end();
  });
});

tap.test('handles missing terms', t => {
  const bakery = {
    get: function(url, headers, callback) {
      const xhr = makeXHRRequest([]);
      callback(null, xhr);
    }
  };
  const termsInstance = new terms.terms('http://1.2.3.4/', bakery);
  termsInstance.showTerms('canonical', null, function(error, terms) {
    t.equal(error, null);
    t.equal(terms, null);
    t.end();
  });
});

tap.test('handles errors fetching terms', t => {
  const bakery = {
    get: function(url, headers, callback) {
      const xhr = makeXHRRequest({error: 'bad wolf'});
      callback(null, xhr);
    }
  };
  const termsInstance = new terms.terms('http://1.2.3.4/', bakery);
  termsInstance.showTerms('canonical', null, function(error, terms) {
    t.equal(error, 'bad wolf');
    t.equal(terms, null);
    t.end();
  });
});

tap.test('handles adding an agreement', t => {
  const bakery = {
    post: function(url, headers, body, callback) {
      t.equal(
        url,
        'http://1.2.3.4/' +
        terms.termsAPIVersion +
        '/agreement');
      const xhr = makeXHRRequest({agreements: [{
        user: 'spinach',
        term: 'these-terms',
        revision: 42,
        'created-on': '2016-06-09T22:07:24Z'
      }]});
      callback(null, xhr);
    }
  };
  const termsInstance = new terms.terms('http://1.2.3.4/', bakery);
  termsInstance.addAgreement(
    [{name: 'canonical', revision: 5}],
    function(error, terms) {
      t.equal(error, null);
      t.deepEqual(terms, [{
        owner: null,
        user: 'spinach',
        term: 'these-terms',
        revision: 42,
        createdAt: new Date(1465510044000),
        name: undefined,
        owner: undefined,
        content: undefined
      }]);
      t.end();
    }
  );
});

tap.test('passes the agreements request the correct args', t => {
  const bakery = {
    post: sinon.stub()
  };
  const termsInstance = new terms.terms('http://1.2.3.4/', bakery);
  termsInstance.addAgreement([{name: 'canonical', owner: 'spinach', revision: 5}]);
  t.equal(bakery.post.callCount, 1);
  t.equal(
    bakery.post.args[0][2],
    '[{"termname":"canonical","termrevision":5,"termowner":"spinach"}]');
  t.end();
});

tap.test('can get agreements for a user', t => {
  const bakery = {
    get: function(url, headers, callback) {
      t.equal(
        url,
        'http://1.2.3.4/' +
        terms.termsAPIVersion +
        '/agreements');
      const xhr = makeXHRRequest([{
        user: 'spinach',
        term: 'One fancy term',
        revision: 47,
        'created-on': '2016-06-09T22:07:24Z'
      }]);
      callback(null, xhr);
    }
  };
  const termsInstance = new terms.terms('http://1.2.3.4/', bakery);
  termsInstance.getAgreements(function(error, terms) {
    t.equal(error, null);
    t.deepEqual(terms, [{
      owner: undefined,
      user: 'spinach',
      term: 'One fancy term',
      revision: 47,
      createdAt: new Date(1465510044000),
      name: undefined,
      owner: undefined,
      content: undefined
    }]);
    t.end();
  });
});

tap.test('handles missing agreements', t => {
  const bakery = {
    get: function(url, headers, callback) {
      var xhr = makeXHRRequest([]);
      callback(null, xhr);
    }
  };
  const termsInstance = new terms.terms('http://1.2.3.4/', bakery);
  termsInstance.getAgreements(function(error, terms) {
    t.equal(error, null);
    t.equal(terms, null);
    t.end();
  });
});

tap.test('handles errors fetching agreements', t => {
  const bakery = {
    get: function(url, headers, callback) {
      const xhr = makeXHRRequest({Message: 'bad wolf'});
      callback(null, xhr);
    }
  };
  const termsInstance = new terms.terms('http://1.2.3.4/', bakery);
  termsInstance.getAgreements(function(error, terms) {
    t.equal(error, 'bad wolf');
    t.equal(terms, null);
    t.end();
  });
});

tap.test('getAgreementsByTerms', t => {
  t.autoend(true);

  t.test('makes a proper request with a single term supplied', t => {
    const bakery = {
      get: (url, headers, callback) => {
        t.equal(
          url,
          'http://1.2.3.4/' +
          terms.termsAPIVersion +
          '/agreement?Terms=hatch/test-term1');
        callback(null, makeXHRRequest([{
          'created-on': '2016-06-09T22:07:24Z',
          content: 'I am term1\n',
          id: 'hatch/test-term1',
          name: 'test-term1',
          owner: 'hatch',
          published: true,
          revision: 2
        }]));
      }
    };
    const termsInstance = new terms.terms('http://1.2.3.4/', bakery);
    termsInstance.getAgreementsByTerms(['hatch/test-term1'], (error, terms) => {
      t.equal(error, null);
      t.deepEqual(terms, [{
        content: 'I am term1\n',
        createdAt: new Date(1465510044000),
        name: 'test-term1',
        owner: 'hatch',
        revision: 2,
        term: undefined,
        user: undefined
      }]);
      t.end();
    });
  });

  t.test('makes a proper request with multiple terms supplied', t => {
    const bakery = {
      get: (url, headers, callback) => {
        t.equal(
          url,
          'http://1.2.3.4/' +
          terms.termsAPIVersion +
          '/agreement?Terms=hatch/test-term1&Terms=hatch/test-term2');
        callback(null, makeXHRRequest([{
          'created-on': '2016-06-09T22:07:24Z',
          content: 'I am term1\n',
          name: 'test-term1',
          owner: 'hatch',
          published: true,
          revision: 2
        }]));
      }
    };
    const termsInstance = new terms.terms('http://1.2.3.4/', bakery);
    termsInstance.getAgreementsByTerms([
      'hatch/test-term1', 'hatch/test-term2'
    ], (error, terms) => {
      t.equal(error, null);
      t.deepEqual(terms, [{
        content: 'I am term1\n',
        createdAt: new Date(1465510044000),
        name: 'test-term1',
        owner: 'hatch',
        revision: 2,
        term: undefined,
        user: undefined
      }]);
      t.end();
    });
  });

  t.test('handles failures fetching agreements', t => {
    const bakery = {
      get: (url, headers, callback) => {
        callback(null, makeXHRRequest({Message: 'it broke'}));
      }
    };
    const termsInstance = new terms.terms('http://1.2.3.4/', bakery);
    termsInstance.getAgreementsByTerms(['user/termname'], (error, terms) => {
      t.equal(error, 'it broke');
      t.equal(terms, null);
      t.end();
    });
  });
});
