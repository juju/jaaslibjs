/* Copyright (C) 2018 Canonical Ltd. */

'use strict';

const tap = require('tap');
const urls = require('./urls');

const URL = urls.URL;

const pathTests = [{
  url: new URL({name: 'django'}),
  path: 'django'
}, {
  url: new URL({name: 'django', user: 'who'}),
  path: 'u/who/django'
}, {
  url: new URL({name: 'django', user: 'dalek', series: 'xenial'}),
  path: 'u/dalek/django/xenial'
}, {
  url: new URL({name: 'haproxy', schema: 'local', revision: 47}),
  path: 'haproxy/47'
}, {
  url: new URL({name: 'haproxy', series: 'xenial'}),
  path: 'haproxy/xenial'
}, {
  url: new URL({name: 'mediawiki-scalable', revision: 0}),
  path: 'mediawiki-scalable/0'
}, {
  url: new URL({
    name: 'haproxy',
    user: 'dalek',
    series: 'trusty',
    revision: 42
  }),
  path: 'u/dalek/haproxy/trusty/42'
}, {
  url: new URL({
    name: 'mediawiki-scalable',
    schema: 'cs',
    user: 'cyberman',
    series: 'bundle',
    revision: 0
  }),
  path: 'u/cyberman/mediawiki-scalable/bundle/0'
}];

const legacyPathTests = [{
  url: new URL({name: 'django'}),
  path: 'django'
}, {
  url: new URL({name: 'django', user: 'who'}),
  path: '~who/django'
}, {
  url: new URL({name: 'django', user: 'dalek', series: 'xenial'}),
  path: '~dalek/xenial/django'
}, {
  url: new URL({name: 'haproxy', schema: 'local', revision: 47}),
  path: 'haproxy-47'
}, {
  url: new URL({name: 'haproxy', series: 'xenial'}),
  path: 'xenial/haproxy'
}, {
  url: new URL({name: 'mediawiki-scalable', revision: 0}),
  path: 'mediawiki-scalable-0'
}, {
  url: new URL({
    name: 'haproxy',
    user: 'dalek',
    series: 'trusty',
    revision: 42
  }),
  path: '~dalek/trusty/haproxy-42'
}, {
  url: new URL({
    name: 'mediawiki-scalable',
    schema: 'cs',
    user: 'cyberman',
    series: 'bundle',
    revision: 0
  }),
  path: '~cyberman/bundle/mediawiki-scalable-0'
}];

// Check that the given URL has the attributes included in parts.
const assertURL = (t, url, parts, about) => {
  const prefix = about ? `${about}: ` : '';
  t.equal(url.name, parts.name, prefix+'name');
  t.equal(url.schema, parts.schema || 'cs', prefix+'schema');
  t.equal(url.user, parts.user || '', prefix+'user');
  t.equal(url.series, parts.series || '', prefix+'series');
  let revision = parts.revision;
  if (!revision && revision !== 0) {
    revision = null;
  }
  t.equal(url.revision, revision, prefix+'revision');
};

tap.test('initializer', t => {
  t.autoend(true);

  t.test('returns a URL from its parts', t => {
    const url = new URL({name: 'django'});
    assertURL(t, url, {name: 'django'});
    t.end();
  });

  t.test('returns a URL from its parts (all parts defined)', t => {
    const parts = {
      name: 'haproxy',
      schema: 'cs',
      user: 'dalek',
      series: 'xenial',
      revision: 42
    };
    const url = new URL(parts);
    assertURL(t, url, parts);
    t.end();
  });

  t.test('fails for validation problems', t => {
    const tests = [{
      parts: {},
      err: 'charm/bundle name required but not provided'
    }, {
      parts: {name: 42},
      err: 'charm/bundle name is not a string: "42"'
    }, {
      parts: {name: '2'},
      err: 'invalid charm/bundle name: "2"'
    }, {
      parts: {name: 'django', schema: 47},
      err: 'schema is not a string: "47"'
    }, {
      parts: {name: 'django', schema: 'exterminate'},
      err: 'unrecognized schema: "exterminate"'
    }, {
      parts: {name: 'django', user: {}},
      err: 'user is not a string: "[object Object]"'
    }, {
      parts: {name: 'django', user: '@'},
      err: 'invalid user: "@"'
    }, {
      parts: {name: 'django', series: 'bad-wolf'},
      err: 'invalid series: "bad-wolf"'
    }, {
      parts: {name: 'django', revision: 'bad-wolf'},
      err: 'invalid revision: "bad-wolf"'
    }, {
      parts: {name: 'django', revision: -1},
      err: 'revision is not a positive number: "-1"'
    }];
    tests.forEach(test => {
      t.throws(() => new URL(test.parts), test.err);
    });
    t.end();
  });
});

tap.test('prototype', t => {
  t.autoend(true);

  t.test('returns the URL path', t => {
    pathTests.forEach(test => {
      t.equal(test.url.path(), test.path);
    });
    t.end();
  });

  t.test('returns the URL legacy path', t => {
    legacyPathTests.forEach(test => {
      t.equal(test.url.legacyPath(), test.path);
    });
    t.end();
  });

  t.test('returns the URL as a string', t => {
    pathTests.forEach(test => {
      t.equal(
        test.url.toString(), `${test.url.schema}:${test.path}`);
    });
    t.end();
  });

  t.test('returns the legacy URL as a string', t => {
    legacyPathTests.forEach(test => {
      t.equal(
        test.url.toLegacyString(), `${test.url.schema}:${test.path}`);
    });
    t.end();
  });

  t.test('returns a URL instance for urls valid with fromString', t => {
    pathTests.forEach(pt => {
      const url = URL.fromAnyString(pt.path);
      t.deepEqual(url.path(), pt.url.path());
    });
    t.end();
  });

  t.test('returns a URL instance for urls valid with fromLegacyString', t => {
    legacyPathTests.forEach(pt => {
      const url = URL.fromAnyString(pt.path);
      t.deepEqual(url.path(), pt.url.path());
    });
    t.end();
  });

  t.test('copies a URL', t => {
    const url = new URL({
      name: 'haproxy',
      schema: 'cs',
      user: 'dalek',
      series: 'xenial',
      revision: 42
    });
    const urlCopy = url.copy();
    // Initially the two URLs are equal.
    t.deepEqual(urlCopy, url, 'initial');
    urlCopy.name = 'apache';
    urlCopy.revision = 47;
    // After changing attributes on the copied URL, the two are not equal
    // anymore.
    t.notDeepEqual(urlCopy, url, 'after change');
    // The original URL has not been changed.
    t.equal(url.name, 'haproxy', 'name');
    t.equal(url.revision, 42, 'revision');
    t.end();
  });

  t.test('checks whether a URL refers to a bundle', t => {
    const url = new URL({name: 'django', series: 'bundle'});
    t.equal(url.isBundle(), true, 'bundle');
    url.series = 'xenial';
    t.equal(url.isBundle(), false, 'xenial');
    url.series = '';
    t.equal(url.isBundle(), false, 'empty');
    t.end();
  });

  t.test('checks whether a URL refers to a local charm or bundle', t => {
    const url = new URL({name: 'django'});
    t.equal(url.isLocal(), false, 'empty');
    url.schema = 'cs';
    t.equal(url.isLocal(), false, 'cs');
    url.schema = 'local';
    t.equal(url.isLocal(), true, 'local');
    t.end();
  });
});

tap.test('fromString', t => {
  t.autoend(true);

  t.test('creates the URL from a string', t => {
    pathTests.forEach(test => {
      let str = test.url.toString();
      let url = URL.fromString(str);
      assertURL(t, url, test.url, str);
      if (!test.url.isLocal()) {
        // Non-local charms strings can be parsed even if they don't
        // explicitly include the schema.
        str = test.url.path();
        url = URL.fromString(str);
        assertURL(t, url, test.url, str);
        // Leading slashes are also handled in this case.
        str = '/' + str;
        url = URL.fromString(str);
        assertURL(t, url, test.url, str);
      }
    });
    t.end();
  });

  t.test('raises errors if the string is not a valid URL', t => {
    const tests = [{
      str: '',
      err: 'invalid URL: ""'
    }, {
      str: 42,
      err: 'invalid URL: "42"'
    }, {
      str: '2',
      err: 'invalid charm/bundle name: "2"'
    }, {
      str: 'bad:django',
      err: 'unrecognized schema: "bad"'
    }, {
      str: '/u/{}/django',
      err: 'invalid user: "{}"'
    }, {
      str: 'u/who',
      err: 'charm/bundle name required but not provided'
    }, {
      str: 'cs:u/who/#',
      err: 'invalid charm/bundle name: "#"'
    }, {
      str: 'local:django:bad',
      err: 'invalid charm/bundle name: "django:bad"'
    }, {
      str: 'haproxy^bad',
      err: 'invalid charm/bundle name: "haproxy^bad"'
    }, {
      str: 'u/my#user/wordpress',
      err: 'invalid user: "my#user"'
    }, {
      str: '/u/dalek/django/xenial/42/bad-wolf',
      err: 'URL includes too many parts: u/dalek/django/xenial/42/bad-wolf'
    }, {
      str: 'django/bundle/0/1',
      err: 'URL includes too many parts: django/bundle/0/1'
    }, {
      str: '/django bundle',
      err: 'URL contains spaces: "/django bundle"'
    }, {
      str: '/django/u/who',
      err: 'invalid series: "u"'
    }, {
      str: 'django/bad-wolf',
      err: 'invalid series: "bad-wolf"'
    }, {
      str: 'django/bundle/bad-wolf',
      err: 'invalid revision: "bad-wolf"'
    }, {
      str: 'haproxy/xenial/-1',
      err: 'revision is not a positive number: "-1"'
    }];
    tests.forEach(test => {
      t.throws(() => URL.fromString(test.str), test.err);
    });
    t.end();
  });
});

tap.test('fromLegacyString', t => {
  t.autoend(true);

  t.test('creates the URL from a legacy string', t => {
    legacyPathTests.forEach(test => {
      let str = test.url.toLegacyString();
      let url = URL.fromLegacyString(str);
      assertURL(t, url, test.url, str);
      if (!test.url.isLocal()) {
        // Non-local charms strings can be parsed even if they don't
        // explicitly include the schema.
        str = test.url.legacyPath();
        url = URL.fromLegacyString(str);
        assertURL(t, url, test.url, str);
      }
    });
    t.end();
  });

  t.test('raises errors if the legacy string is not a valid URL', t => {
    const tests = [{
      str: '',
      err: 'invalid URL: ""'
    }, {
      str: 42,
      err: 'invalid URL: "42"'
    }, {
      str: '2',
      err: 'invalid charm/bundle name: "2"'
    }, {
      str: 'bad:django',
      err: 'unrecognized schema: "bad"'
    }, {
      str: '~{}/django',
      err: 'invalid user: "{}"'
    }, {
      str: '~who',
      err: 'charm/bundle name required but not provided'
    }, {
      str: 'cs:~who/#',
      err: 'invalid charm/bundle name: "#"'
    }, {
      str: 'local:django:bad',
      err: 'invalid charm/bundle name: "django:bad"'
    }, {
      str: 'haproxy^bad',
      err: 'invalid charm/bundle name: "haproxy^bad"'
    }, {
      str: '~my#user/wordpress',
      err: 'invalid user: "my#user"'
    }, {
      str: '~dalek/xenial/django-42/bad-wolf',
      err: 'URL includes too many parts: ~dalek/xenial/django-42/bad-wolf'
    }, {
      str: 'bundle/django-0/1',
      err: 'URL includes too many parts: bundle/django-0/1'
    }, {
      str: 'bundle django',
      err: 'URL contains spaces: "bundle django"'
    }, {
      str: '/django/~who',
      err: 'invalid charm/bundle name: "~who"'
    }, {
      str: 'django-2-bad-wolf',
      err: 'invalid charm/bundle name: "django-2-bad-wolf"'
    }, {
      str: 'xenial/haproxy--1',
      err: 'invalid charm/bundle name: "haproxy-"'
    }];
    tests.forEach(test => {
      t.throws(() => URL.fromLegacyString(test.str), test.err);
    });
    t.end();
  });
});
