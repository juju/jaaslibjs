/* Copyright (C) 2018 Canonical Ltd. */

'use strict';

const sinon = require('sinon');
const tap = require('tap');

const payment = require('./payment');

function makeXHRRequest(obj, json=true) {
  return {target: {responseText: json ? JSON.stringify(obj) : obj}};
}

function setupFakes() {
  return {
    returnedUser: {
      nickname: 'spinach',
      name: 'Geoffrey Spinach',
      email: 'spinach@example.com',
      business: true,
      addresses: [{
        id: 'address1',
        city: 'New Orleans',
        postcode: '70130'
      }],
      vat: '1234',
      'business-name': 'Spinachy business',
      'billing-addresses': [{
        id: 'address2',
        city: 'New Orleans',
        postcode: '70130'
      }],
      'payment-methods': [{
        address: {
          id: 'address3',
          name: null,
          line1: null,
          line2: null,
          county: 'Bunnyhug',
          city: 'New Orleans',
          postcode: null,
          country: null,
          phones: []
        },
        id: 'paymentmethod1',
        brand: 'Brand',
        last4: '1234',
        month: 3,
        name: 'Main',
        'card-holder': 'Mr G Spinach',
        valid: true,
        year: 2017
      }],
      'allow-email': true,
      valid: true
    },
    parsedUser: {
      nickname: 'spinach',
      name: 'Geoffrey Spinach',
      email: 'spinach@example.com',
      business: true,
      addresses: [{
        id: 'address1',
        name: null,
        line1: null,
        line2: null,
        name: null,
        city: 'New Orleans',
        county: null,
        postcode: '70130',
        country: null,
        phones: []
      }],
      vat: '1234',
      businessName: 'Spinachy business',
      billingAddresses: [{
        id: 'address2',
        name: null,
        line1: null,
        line2: null,
        name: null,
        city: 'New Orleans',
        county: null,
        postcode: '70130',
        country: null,
        phones: []
      }],
      paymentMethods: [{
        address: {
          id: 'address3',
          name: null,
          line1: null,
          line2: null,
          state: 'Bunnyhug',
          city: 'New Orleans',
          postcode: null,
          country: null
        },
        id: 'paymentmethod1',
        brand: 'Brand',
        last4: '1234',
        month: 3,
        name: 'Main',
        cardHolder: 'Mr G Spinach',
        valid: true,
        year: 2017
      }],
      allowEmail: true,
      valid: true
    }
  };
}

tap.test('exists', t => {
  const bakery = {};
  const paymentInstance = new payment.payment(
    'http://1.2.3.4/', bakery);
  t.strictEqual(
    paymentInstance instanceof payment.payment, true);
  t.strictEqual(
    paymentInstance.url,
    `http://1.2.3.4/${payment.paymentAPIVersion}`);
  t.end();
});

tap.test('can get a user', t => {
  const {parsedUser, returnedUser} = setupFakes();
  const bakery = {
    get: function(path, headers, callback) {
      t.equal(
        path,
        'http://1.2.3.4/' +
        payment.paymentAPIVersion +
        '/u/spinach');
      const xhr = makeXHRRequest(returnedUser);
      callback(null, xhr);
    }
  };
  const paymentInstance = new payment.payment(
    'http://1.2.3.4/', bakery);
  paymentInstance.getUser('spinach', function(error, user) {
    t.equal(error, null);
    t.deepEqual(user, parsedUser);
    t.end();
  });
});

tap.test('can return correctly when getting a non-existent user', t => {
  const bakery = {
    get: function(path, headers, callback) {
      t.equal(
        path,
        'http://1.2.3.4/' +
        payment.paymentAPIVersion +
        '/u/spinach');
      const xhr = makeXHRRequest();
      callback(null, xhr);
    }
  };
  const paymentInstance = new payment.payment(
    'http://1.2.3.4/', bakery);
  paymentInstance.getUser('spinach', function(error, user) {
    t.equal(error, null);
    t.deepEqual(user, null);
    t.end();
  });
});

tap.test('can handle missing fields when getting a user', t => {
  const bakery = {
    get: function(path, headers, callback) {
      t.equal(
        path,
        'http://1.2.3.4/' +
        payment.paymentAPIVersion +
        '/u/spinach');
      const xhr = makeXHRRequest({
        'billing-addresses': [{
          id: 'address2',
          city: 'New Orleans'
        }],
        'payment-methods': [{
          address: {
            id: 'address3',
            city: 'New Orleans'
          },
          id: 'paymentmethod1'
        }]
      });
      callback(null, xhr);
    }
  };
  const paymentInstance = new payment.payment(
    'http://1.2.3.4/', bakery);
  paymentInstance.getUser('spinach', function(error, user) {
    t.equal(error, null);
    t.deepEqual(user, {
      nickname: null,
      name: null,
      email: null,
      business: false,
      addresses: [],
      vat: null,
      businessName: null,
      billingAddresses: [{
        id: 'address2',
        name: null,
        line1: null,
        line2: null,
        name: null,
        city: 'New Orleans',
        county: null,
        postcode: null,
        country: null,
        phones: []
      }],
      paymentMethods: [{
        address: {
          id: 'address3',
          name: null,
          line1: null,
          line2: null,
          state: null,
          city: 'New Orleans',
          postcode: null,
          country: null
        },
        id: 'paymentmethod1',
        brand: null,
        last4: null,
        month: null,
        name: null,
        cardHolder: null,
        valid: false,
        year: null
      }],
      allowEmail: false,
      valid: false
    });
    t.end();
  });
});

tap.test('handles errors when getting a user', t => {
  const bakery = {
    get: function(url, headers, callback) {
      const xhr = makeXHRRequest({Error: 'Uh oh!'});
      callback(null, xhr);
    }
  };
  const paymentInstance = new payment.payment(
    'http://1.2.3.4/', bakery);
  paymentInstance.getUser('spinach', function(error, user) {
    t.equal(error, 'Uh oh!');
    t.strictEqual(user, null);
    t.end();
  });
});

tap.test('can create a user', t => {
  const bakery = {
    post: sinon.stub()
  };
  const paymentInstance = new payment.payment('http://1.2.3.4/', bakery);
  const newUser = {
    nickname: 'spinach',
    name: 'Geoffrey Spinach',
    email: 'spinach@example.com',
    addresses: [{
      city: 'New Orleans',
      postcode: '70130'
    }],
    vat: '1234',
    business: true,
    businessName: 'Spinachy business',
    billingAddresses: [{
      city: 'New Orleans',
      postcode: '70130',
      country: 'US'
    }],
    allowEmail: true,
    token: '54321'
  };
  paymentInstance.createUser(newUser, sinon.stub());
  t.deepEqual(JSON.parse(bakery.post.args[0][2]), {
    nickname: 'spinach',
    name: 'Geoffrey Spinach',
    email: 'spinach@example.com',
    addresses: [{
      name: null,
      line1: null,
      line2: null,
      city: 'New Orleans',
      county: null,
      postcode: '70130',
      'country-code': null,
      phones: []
    }],
    vat: '1234',
    business: true,
    'business-name': 'Spinachy business',
    'billing-addresses': [{
      name: null,
      line1: null,
      line2: null,
      city: 'New Orleans',
      county: null,
      postcode: '70130',
      'country-code': 'US',
      phones: []
    }],
    'allow-email': true,
    token: '54321',
    'payment-method-name': null
  });
  t.end();
});

tap.test('can return the user when after creating a user', t => {
  const {parsedUser, returnedUser} = setupFakes();
  const bakery = {
    post: function(url, headers, body, callback) {
      t.equal(
        url,
        'http://1.2.3.4/' +
        payment.paymentAPIVersion +
        '/u');
      const xhr = makeXHRRequest(returnedUser);
      callback(null, xhr);
    }
  };
  const paymentInstance = new payment.payment(
    'http://1.2.3.4/', bakery);
  const newUser = {
    name: 'Geoffrey Spinach',
    email: 'spinach@example.com',
    addresses: [{
      id: 'address1',
      city: 'New Orleans',
      postcode: '70130'
    }],
    vat: '1234',
    business: true,
    businessName: 'Spinachy business',
    billingAddresses: [{
      id: 'address2',
      city: 'New Orleans',
      postcode: '70130'
    }],
    allowEmail: true,
    token: '54321'
  };
  paymentInstance.createUser(newUser, function(error, user) {
    t.strictEqual(error, null);
    t.deepEqual(user, parsedUser);
  });
  t.end();
});

tap.test('handles errors when creating a user', t => {
  const bakery = {
    post: function(url, headers, body, callback) {
      const xhr = makeXHRRequest({Error: 'Uh oh!'});
      callback(null, xhr);
    }
  };
  const paymentInstance = new payment.payment(
    'http://1.2.3.4/', bakery);
  paymentInstance.createUser({}, function(error, user) {
    t.equal(error, 'Uh oh!');
    t.strictEqual(user, null);
    t.end();
  });
});

tap.test('can get a list of countries', t => {
  const countries = [{
    name: 'Australia',
    code: 'AU'
  }];
  const bakery = {
    get: (url, headers, callback) => {
      t.equal(
        url,
        'http://1.2.3.4/' +
        payment.paymentAPIVersion +
        '/country');
      const xhr = makeXHRRequest({countries: countries});
      callback(null, xhr);
    }
  };
  const paymentInstance = new payment.payment('http://1.2.3.4/', bakery);
  paymentInstance.getCountries((error, response) => {
    t.strictEqual(error, null);
    t.deepEqual(response, countries);
    t.end();
  });
});

tap.test('handles errors when getting the country list', t => {
  const bakery = {
    get: (url, headers, callback) => {
      const xhr = makeXHRRequest({Error: 'Uh oh!'});
      callback(null, xhr);
    }
  };
  const paymentInstance = new payment.payment('http://1.2.3.4/', bakery);
  paymentInstance.getCountries((error, response) => {
    t.equal(error, 'Uh oh!');
    t.strictEqual(response, null);
    t.end();
  });
});

tap.test('getPaymentMethods', t => {
  t.autoend(true);

  t.test('can get payment methods for a user', t => {
    const bakery = {
      get: function(url, headers, callback) {
        t.equal(
          url,
          'http://1.2.3.4/' +
          payment.paymentAPIVersion +
          '/u/spinach/payment-methods');
        const xhr = makeXHRRequest({
          'payment-methods': [{
            address: {
              id: 'address1',
              name: 'Home',
              line1: '1 Maple St',
              line2: null,
              county: 'Bunnyhug',
              city: 'Sasquatch',
              postcode: '90210',
              country: 'North of the Border'
            },
            id: 'paymentmethod1',
            brand: 'Brand',
            last4: '1234',
            month: 3,
            name: 'Main',
            'card-holder': 'Mr G Spinach',
            valid: true,
            year: 2017
          }]
        });
        callback(null, xhr);
      }
    };
    const paymentInstance = new payment.payment('http://1.2.3.4/', bakery);
    paymentInstance.getPaymentMethods('spinach', function(error, response) {
      t.strictEqual(error, null);
      t.deepEqual(response, [{
        address: {
          id: 'address1',
          name: 'Home',
          line1: '1 Maple St',
          line2: null,
          state: 'Bunnyhug',
          city: 'Sasquatch',
          postcode: '90210',
          country: 'North of the Border'
        },
        id: 'paymentmethod1',
        brand: 'Brand',
        last4: '1234',
        month: 3,
        name: 'Main',
        cardHolder: 'Mr G Spinach',
        valid: true,
        year: 2017
      }]);
      t.end();
    });
  });

  t.test('handles errors when getting a user', t => {
    const bakery = {
      get: function(url, headers, callback) {
        const xhr = makeXHRRequest({Message: 'Uh oh!'});
        callback(null, xhr);
      }
    };
    const paymentInstance = new payment.payment('http://1.2.3.4/', bakery);
    paymentInstance.getPaymentMethods('spinach', function(error, user) {
      t.equal(error, 'Uh oh!');
      t.strictEqual(user, null);
      t.end();
    });
  });
});

tap.test('createPaymentMethod', t => {
  t.autoend(true);

  t.test('can create a payment method', t => {
    const bakery = {
      post: sinon.stub()
    };
    const paymentInstance = new payment.payment('http://1.2.3.4/', bakery);
    paymentInstance.createPaymentMethod(
      'spinach', 'token123', 'Business',
      sinon.stub());
    t.equal(bakery.post.callCount, 1);
    t.deepEqual(
      bakery.post.args[0][2], JSON.stringify({
        'payment-method-name': 'Business',
        token: 'token123'
      }));
    t.end();
  });

  t.test('can return the payment method when it has been created', t => {
    const bakery = {
      post: function(url, headers, body, callback) {
        t.equal(
          url,
          'http://1.2.3.4/' +
          payment.paymentAPIVersion +
          '/u/spinach/payment-methods');
        const xhr = makeXHRRequest({
          address: {
            id: 'address1',
            name: 'Home',
            line1: '1 Maple St',
            line2: 'Loonie Lane',
            county: 'Bunnyhug',
            city: 'Sasquatch',
            postcode: '90210',
            country: 'North of the Border'
          },
          id: 'paymentmethod1',
          brand: 'Brand',
          last4: '1234',
          month: 3,
          name: 'Main',
          'card-holder': 'Mr G Spinach',
          valid: true,
          year: 2017
        });
        callback(null, xhr);
      }
    };
    const paymentInstance = new payment.payment('http://1.2.3.4/', bakery);
    paymentInstance.createPaymentMethod(
      'spinach', 'token123', null, (error, response) => {
        t.strictEqual(error, null);
        t.deepEqual(response, {
          address: {
            id: 'address1',
            name: 'Home',
            line1: '1 Maple St',
            line2: 'Loonie Lane',
            state: 'Bunnyhug',
            city: 'Sasquatch',
            postcode: '90210',
            country: 'North of the Border'
          },
          id: 'paymentmethod1',
          brand: 'Brand',
          last4: '1234',
          month: 3,
          name: 'Main',
          cardHolder: 'Mr G Spinach',
          valid: true,
          year: 2017
        });
        t.end();
      });
  });

  t.test('handles errors when creating a payment method', t => {
    const bakery = {
      post: function(url, headers, body, callback) {
        const xhr = makeXHRRequest({Message: 'Uh oh!'});
        callback(null, xhr);
      }
    };
    const paymentInstance = new payment.payment('http://1.2.3.4/', bakery);
    paymentInstance.createPaymentMethod(
      'spinach', 'token123', null, (error, response) => {
        t.equal(error, 'Uh oh!');
        t.strictEqual(response, null);
        t.end();
      });
  });
});

tap.test('updatePaymentMethod', t => {
  t.autoend(true);

  t.test('can update a payment method', t => {
    const bakery = {
      put: sinon.stub()
    };
    const paymentInstance = new payment.payment('http://1.2.3.4/', bakery);
    const address = {
      line1: '10 Maple St',
      line2: '',
      city: 'Sasquatch',
      county: 'Bunnyhug',
      postcode: '90210',
      country: 'CA'
    };
    paymentInstance.updatePaymentMethod(
      'spinach', 'paymentmethod1', address, '12/17', sinon.stub());
    t.equal(bakery.put.callCount, 1);
    t.deepEqual(bakery.put.args[0][2], JSON.stringify({
      address: {
        name: null,
        line1: '10 Maple St',
        line2: null,
        city: 'Sasquatch',
        county: 'Bunnyhug',
        postcode: '90210',
        'country-code': 'CA',
        phones: []
      },
      month: 12,
      year: 17
    }));
    t.end();
  });

  t.test('can return when there are no errors', t => {
    const bakery = {
      put: function(url, headers, body, callback) {
        t.equal(
          url,
          'http://1.2.3.4/' +
          payment.paymentAPIVersion +
          '/u/spinach/payment-methods/paymentmethod1/content');
        const xhr = makeXHRRequest('success');
        callback(null, xhr);
      }
    };
    const paymentInstance = new payment.payment('http://1.2.3.4/', bakery);
    paymentInstance.updatePaymentMethod(
      'spinach', 'paymentmethod1', {}, '12/17', error => {
        t.strictEqual(error, null);
        t.end();
      });
  });

  t.test('handles errors when updating a payment method', t => {
    const bakery = {
      put: function(url, headers, body, callback) {
        const xhr = makeXHRRequest({Message: 'Uh oh!'});
        callback(null, xhr);
      }
    };
    const paymentInstance = new payment.payment('http://1.2.3.4/', bakery);
    paymentInstance.updatePaymentMethod(
      'spinach', 'paymentmethod1', {}, '12/17', error => {
        t.equal(error, 'Uh oh!');
        t.end();
      });
  });
});

tap.test('removePaymentMethod', t => {
  t.autoend(true);

  t.test('can remove a payment method', t => {
    const bakery = {
      delete: sinon.stub()
    };
    const paymentInstance = new payment.payment('http://1.2.3.4/', bakery);
    paymentInstance.removePaymentMethod('spinach', 'paymentmethod1', sinon.stub());
    t.equal(bakery.delete.callCount, 1);
    t.deepEqual(bakery.delete.args[0][2], JSON.stringify({
      'payment-method-name': 'paymentmethod1'
    }));
    t.end();
  });

  t.test('can return when there are no errors', t => {
    const bakery = {
      delete: function(url, headers, body, callback) {
        t.equal(
          url,
          'http://1.2.3.4/' +
          payment.paymentAPIVersion +
          '/u/spinach/payment-methods/paymentmethod1');
        const xhr = makeXHRRequest('success');
        callback(null, xhr);
      }
    };
    const paymentInstance = new payment.payment('http://1.2.3.4/', bakery);
    paymentInstance.removePaymentMethod(
      'spinach', 'paymentmethod1', (error, response) => {
        t.strictEqual(error, null);
        t.end();
      });
  });

  t.test('handles errors when removing a payment method', t => {
    const bakery = {
      delete: function(url, headers, body, callback) {
        const xhr = makeXHRRequest({error: 'Uh oh!'});
        callback(null, xhr);
      }
    };
    const paymentInstance = new payment.payment('http://1.2.3.4/', bakery);
    paymentInstance.removePaymentMethod(
      'spinach', 'paymentmethod1', (error, response) => {
        t.equal(error, 'Uh oh!');
        t.end();
      });
  });
});

tap.test('addAddress', t => {
  t.autoend(true);

  function setupAddress() {
    return {
      address: {
        name: 'Home',
        line1: '1 Maple St',
        line2: null,
        county: 'Bunnyhug',
        city: 'Sasquatch',
        postcode: '90210',
        country: 'CA'
      }
    };
  }

  t.test('can add an address', t => {
    const {address} = setupAddress();
    const bakery = {
      put: sinon.stub()
    };
    const paymentInstance = new payment.payment('http://1.2.3.4/', bakery);
    paymentInstance.addAddress('spinach', address, sinon.stub());
    t.equal(bakery.put.callCount, 1);
    t.deepEqual(bakery.put.args[0][2], JSON.stringify({
      name: 'Home',
      line1: '1 Maple St',
      line2: null,
      city: 'Sasquatch',
      county: 'Bunnyhug',
      postcode: '90210',
      'country-code': 'CA',
      phones: []
    }));
    t.end();
  });

  tap.test('can successfully create the address', t => {
    const {address} = setupAddress();
    const bakery = {
      put: function(url, headers, body, callback) {
        t.equal(
          url,
          'http://1.2.3.4/' +
          payment.paymentAPIVersion +
          '/u/spinach/addresses');
        const xhr = makeXHRRequest();
        callback(null, xhr);
      }
    };
    const paymentInstance = new payment.payment('http://1.2.3.4/', bakery);
    paymentInstance.addAddress('spinach', address, error => {
      t.strictEqual(error, null);
      t.end();
    });
  });

  t.test('handles errors when adding an address', t => {
    const {address} = setupAddress();
    const bakery = {
      put: function(url, headers, body, callback) {
        const xhr = makeXHRRequest({Message: 'Uh oh!'});
        callback(null, xhr);
      }
    };
    const paymentInstance = new payment.payment('http://1.2.3.4/', bakery);
    paymentInstance.addAddress('spinach', address, error => {
      t.equal(error, 'Uh oh!');
      t.end();
    });
  });
});

tap.test('addBillingAddress', t => {
  t.autoend(true);

  function setupAddress() {
    return {
      address: {
        name: 'Home',
        line1: '1 Maple St',
        line2: null,
        county: 'Bunnyhug',
        city: 'Sasquatch',
        postcode: '90210',
        country: 'CA'
      }
    };
  }

  t.test('can add a billing address', t => {
    const {address} = setupAddress();
    const bakery = {
      put: sinon.stub()
    };
    const paymentInstance = new payment.payment('http://1.2.3.4/', bakery);
    paymentInstance.addBillingAddress('spinach', address, sinon.stub());
    t.equal(bakery.put.callCount, 1);
    t.deepEqual(bakery.put.args[0][2], JSON.stringify({
      name: 'Home',
      line1: '1 Maple St',
      line2: null,
      city: 'Sasquatch',
      county: 'Bunnyhug',
      postcode: '90210',
      'country-code': 'CA',
      phones: []
    }));
    t.end();
  });

  t.test('can successfully create the billing address', t => {
    const {address} = setupAddress();
    const bakery = {
      put: function(url, headers, body, callback) {
        t.equal(
          url,
          'http://1.2.3.4/' +
          payment.paymentAPIVersion +
          '/u/spinach/billing-addresses');
        const xhr = makeXHRRequest();
        callback(null, xhr);
      }
    };
    const paymentInstance = new payment.payment('http://1.2.3.4/', bakery);
    paymentInstance.addBillingAddress('spinach', address, error => {
      t.strictEqual(error, null);
      t.end();
    });
  });

  t.end('handles errors when adding a billing address', t => {
    const {address} = setupAddress();
    const bakery = {
      put: function(url, headers, body, callback) {
        const xhr = makeXHRRequest({Message: 'Uh oh!'});
        callback(null, xhr);
      }
    };
    const paymentInstance = new payment.payment('http://1.2.3.4/', bakery);
    paymentInstance.addBillingAddress('spinach', address, error => {
      t.equal(error, 'Uh oh!');
      t.end();
    });
  });
});

tap.test('removeAddress', t => {
  t.autoend(true);

  t.test('can remove an address', t => {
    const bakery = {
      delete: sinon.stub()
    };
    const paymentInstance = new payment.payment('http://1.2.3.4/', bakery);
    paymentInstance.removeAddress('spinach', 'address1', sinon.stub());
    t.equal(bakery.delete.callCount, 1);
    t.strictEqual(bakery.delete.args[0][2], null);
    t.end();
  });

  t.test('can return when there are no errors', t => {
    const bakery = {
      delete: function(url, headers, body, callback) {
        t.equal(
          url,
          'http://1.2.3.4/' +
          payment.paymentAPIVersion +
          '/u/spinach/addresses/address1');
        const xhr = makeXHRRequest('success');
        callback(null, xhr);
      }
    };
    const paymentInstance = new payment.payment('http://1.2.3.4/', bakery);
    paymentInstance.removeAddress('spinach', 'address1', (error, response) => {
      t.strictEqual(error, null);
      t.end();
    });
  });

  t.test('handles errors when removing an address', t => {
    const bakery = {
      delete: function(url, headers, body, callback) {
        const xhr = makeXHRRequest({error: 'Uh oh!'});
        callback(null, xhr);
      }
    };
    const paymentInstance = new payment.payment('http://1.2.3.4/', bakery);
    paymentInstance.removeAddress('spinach', 'address1', (error, response) => {
      t.equal(error, 'Uh oh!');
      t.end();
    });
  });
});

tap.test('removeBillingAddress', t => {
  t.autoend(true);

  t.test('can remove a biling address', t => {
    const bakery = {
      delete: sinon.stub()
    };
    const paymentInstance = new payment.payment('http://1.2.3.4/', bakery);
    paymentInstance.removeBillingAddress('spinach', 'address1', sinon.stub());
    t.equal(bakery.delete.callCount, 1);
    t.strictEqual(bakery.delete.args[0][2], null);
    t.end();
  });

  t.test('can return when there are no errors', t => {
    const bakery = {
      delete: function(url, headers, body, callback) {
        t.equal(
          url,
          'http://1.2.3.4/' +
          payment.paymentAPIVersion +
          '/u/spinach/billing-addresses/address1');
        const xhr = makeXHRRequest('success');
        callback(null, xhr);
      }
    };
    const paymentInstance = new payment.payment('http://1.2.3.4/', bakery);
    paymentInstance.removeBillingAddress('spinach', 'address1', (error, response) => {
      t.strictEqual(error, null);
      t.end();
    });
  });

  t.test('handles errors when removing a billing address', t => {
    const bakery = {
      delete: function(url, headers, body, callback) {
        const xhr = makeXHRRequest({error: 'Uh oh!'});
        callback(null, xhr);
      }
    };
    const paymentInstance = new payment.payment('http://1.2.3.4/', bakery);
    paymentInstance.removeBillingAddress('spinach', 'address1', (error, response) => {
      t.equal(error, 'Uh oh!');
      t.end();
    });
  });
});

tap.test('updateAddress', t => {
  t.autoend(true);

  function setupAddress() {
    return {
      address: {
        name: 'Home',
        line1: '1 Maple St',
        line2: null,
        county: 'Bunnyhug',
        city: 'Sasquatch',
        postcode: '90210',
        country: 'CA'
      }
    };
  }

  t.test('can update an address', t => {
    const {address} = setupAddress();
    const bakery = {
      put: sinon.stub()
    };
    const paymentInstance = new payment.payment('http://1.2.3.4/', bakery);
    paymentInstance.updateAddress('spinach', 'address1', address, sinon.stub());
    t.equal(bakery.put.callCount, 1);
    t.deepEqual(JSON.parse(bakery.put.args[0][2]), {
      id: 'address1',
      name: 'Home',
      line1: '1 Maple St',
      line2: null,
      city: 'Sasquatch',
      county: 'Bunnyhug',
      postcode: '90210',
      'country-code': 'CA',
      phones: []
    });
    t.end();
  });

  t.test('can successfully update the address', t => {
    const {address} = setupAddress();
    const bakery = {
      put: function(url, headers, body, callback) {
        t.equal(
          url,
          'http://1.2.3.4/' +
          payment.paymentAPIVersion +
          '/u/spinach/addresses/address1');
        const xhr = makeXHRRequest();
        callback(null, xhr);
      }
    };
    const paymentInstance = new payment.payment('http://1.2.3.4/', bakery);
    paymentInstance.updateAddress('spinach', 'address1', address, error => {
      t.strictEqual(error, null);
      t.end();
    });
  });

  t.test('handles errors when updating an address', t => {
    const {address} = setupAddress();
    const bakery = {
      put: function(url, headers, body, callback) {
        const xhr = makeXHRRequest({Message: 'Uh oh!'});
        callback(null, xhr);
      }
    };
    const paymentInstance = new payment.payment('http://1.2.3.4/', bakery);
    paymentInstance.updateAddress('spinach', 'address1', address, error => {
      t.equal(error, 'Uh oh!');
      t.end();
    });
  });
});

tap.test('updateBillingAddress', t => {
  t.autoend(true);

  function setupAddress() {
    return {
      address: {
        name: 'Home',
        line1: '1 Maple St',
        line2: null,
        county: 'Bunnyhug',
        city: 'Sasquatch',
        postcode: '90210',
        country: 'CA'
      }
    };
  }

  t.test('can update a billing address', t => {
    const {address} = setupAddress();
    const bakery = {
      put: sinon.stub()
    };
    const paymentInstance = new payment.payment('http://1.2.3.4/', bakery);
    paymentInstance.updateBillingAddress(
      'spinach', 'address1', address, sinon.stub());
    t.equal(bakery.put.callCount, 1);
    t.deepEqual(JSON.parse(bakery.put.args[0][2]), {
      id: 'address1',
      name: 'Home',
      line1: '1 Maple St',
      line2: null,
      city: 'Sasquatch',
      county: 'Bunnyhug',
      postcode: '90210',
      'country-code': 'CA',
      phones: []
    });
    t.end();
  });

  t.test('can successfully update the billing address', t => {
    const {address} = setupAddress();
    const bakery = {
      put: function(url, headers, body, callback) {
        t.equal(
          url,
          'http://1.2.3.4/' +
          payment.paymentAPIVersion +
          '/u/spinach/billing-addresses/address1');
        const xhr = makeXHRRequest();
        callback(null, xhr);
      }
    };
    const paymentInstance = new payment.payment('http://1.2.3.4/', bakery);
    paymentInstance.updateBillingAddress('spinach', 'address1', address, error => {
      t.strictEqual(error, null);
      t.end();
    });
  });

  t.test('handles errors when updating a billing address', t => {
    const {address} = setupAddress();
    const bakery = {
      put: function(url, headers, body, callback) {
        const xhr = makeXHRRequest({error: 'Uh oh!'});
        callback(null, xhr);
      }
    };
    const paymentInstance = new payment.payment('http://1.2.3.4/', bakery);
    paymentInstance.updateBillingAddress('spinach', 'address1', address, error => {
      t.equal(error, 'Uh oh!');
      t.end();
    });
  });
});

tap.test('getCharges', t => {
  t.autoend(true);

  t.test('can get a list of charges', t => {
    const bakery = {
      get: function(url, headers, callback) {
        t.equal(
          url,
          'http://1.2.3.4/' +
          payment.paymentAPIVersion +
          '/charges?nickname=spinach');
        const xhr = makeXHRRequest({
          charges: [{
            id: 'TEST-12344',
            'statement-id': '12344',
            price: 10000,
            vat: 2000,
            currency: 'USD',
            nickname: 'spinach',
            for: '2016-01-02T15:04:05Z',
            origin: 'TEST',
            state: 'done',
            'line-items': [{
              name: 'this is line 1',
              details: 'a bit more details for line 1',
              usage: 'something',
              price: '48'
            }],
            'payment-received-at': '2017-04-28T07:49:39.925Z',
            'payment-method-used': {
              address: {
                id: 'address1',
                name: 'Home',
                line1: '1 Maple St',
                line2: null,
                county: 'Bunnyhug',
                city: 'Sasquatch',
                postcode: '90210',
                country: 'North of the Border'
              },
              id: 'paymentmethod1',
              brand: 'Brand',
              last4: '1234',
              month: 3,
              name: 'Main',
              'card-holder': 'Mr G Spinach',
              valid: true,
              year: 2017
            },
            'payment-retry-delay': 10,
            'payment-retry-max': 2,
            'payment-method-update-retry-delay': 10,
            'payment-method-update-retry-max': 100
          }]
        });
        callback(null, xhr);
      }
    };
    const paymentInstance = new payment.payment('http://1.2.3.4/', bakery);
    paymentInstance.getCharges('spinach', (error, response) => {
      t.strictEqual(error, null);
      t.deepEqual(response, [{
        id: 'TEST-12344',
        statementId: '12344',
        price: 10000,
        vat: 2000,
        currency: 'USD',
        nickname: 'spinach',
        for: '2016-01-02T15:04:05Z',
        origin: 'TEST',
        state: 'done',
        lineItems: [{
          name: 'this is line 1',
          details: 'a bit more details for line 1',
          usage: 'something',
          price: '48'
        }],
        paymentReceivedAt: '2017-04-28T07:49:39.925Z',
        paymentMethodUsed: {
          address: {
            id: 'address1',
            name: 'Home',
            line1: '1 Maple St',
            line2: null,
            state: 'Bunnyhug',
            city: 'Sasquatch',
            postcode: '90210',
            country: 'North of the Border'
          },
          id: 'paymentmethod1',
          brand: 'Brand',
          last4: '1234',
          month: 3,
          name: 'Main',
          cardHolder: 'Mr G Spinach',
          valid: true,
          year: 2017
        },
        paymentRetryDelay: 10,
        paymentRetryMax: 2,
        paymentMethodUpdateRetryDelay: 10,
        paymentMethodUpdateRetryMax: 100
      }]);
      t.end();
    });
  });

  t.test('handles errors when getting charges', t => {
    const bakery = {
      get: function(url, headers, callback) {
        const xhr = makeXHRRequest({Message: 'Uh oh!'});
        callback(null, xhr);
      }
    };
    const paymentInstance = new payment.payment('http://1.2.3.4/', bakery);
    paymentInstance.getCharges('spinach', (error, response) => {
      t.equal(error, 'Uh oh!');
      t.strictEqual(response, null);
      t.end();
    });
  });
});

tap.test('getReceipt', t => {
  t.autoend(true);

  t.test('can get a receipt', t => {
    const bakery = {
      get: (url, headers, callback) => {
        t.equal(
          url,
          'http://1.2.3.4/' +
          payment.paymentAPIVersion +
          '/receipts/charge123');
        const xhr = makeXHRRequest('<html>...</html>', false);
        callback(null, xhr);
      }
    };
    const paymentInstance = new payment.payment('http://1.2.3.4/', bakery);
    paymentInstance.getReceipt('charge123', (error, response) => {
      t.strictEqual(error, null);
      t.equal(response, '<html>...</html>');
      t.end();
    });
  });

  t.test('handles errors when getting a receipt', t => {
    const bakery = {
      get: (url, headers, callback) => {
        const xhr = makeXHRRequest({error: 'Uh oh!'});
        callback(null, xhr);
      }
    };
    const paymentInstance = new payment.payment('http://1.2.3.4/', bakery);
    paymentInstance.getReceipt('charge123', (error, response) => {
      t.equal(error, 'Uh oh!');
      t.strictEqual(response, null);
      t.end();
    });
  });
});
