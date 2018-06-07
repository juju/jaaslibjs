/* Copyright (C) 2018 Canonical Ltd. */

'use strict';

const sinon = require('sinon');
const tap = require('tap');

const stripe = require('./stripe');

tap.test('jujulib Stripe service', t => {
  t.autoend(true);

  function setupFakes() {
    return {
      fakeStripe: {
        createToken: sinon.stub()
      }
    };
  }

  t.test('exists', t => {
    const stripeInstance = new stripe('http://example.com', 'key123');
    t.strictEqual(stripeInstance instanceof stripe, true);
    t.equal(stripeInstance.url, 'http://example.com/v3/');
    t.equal(stripeInstance.stripeKey, 'key123');
    t.end();
  });

  t.test('calls the callback once the script has loaded', t => {
    const {fakeStripe} = setupFakes();
    const stripeInstance = new stripe('http://example.com', 'key123');
    const stripeClass = sinon.stub().returns(fakeStripe);
    stripeInstance._loadScript = sinon.stub().callsArg(0);
    stripeInstance._getStripeModule = sinon.stub().returns(stripeClass);
    const callback = sinon.stub();
    stripeInstance._getStripe(callback);
    t.equal(callback.callCount, 1);
    t.equal(callback.args[0][0], fakeStripe);
    t.equal(stripeInstance._getStripeModule.callCount, 1);
    t.equal(stripeClass.callCount, 1);
    t.equal(stripeClass.args[0][0], 'key123');
    t.end();
  });

  t.test('does not load the script more than once', t => {
    const {fakeStripe} = setupFakes();
    const stripeInstance = new stripe('http://example.com', 'key123');
    stripeInstance._loadScript = sinon.stub().callsArg(0);
    stripeInstance._getStripeModule = sinon.stub().returns(
      sinon.stub().returns(fakeStripe));
    const callback = sinon.stub();
    stripeInstance._getStripe(callback);
    stripeInstance._getStripe(callback);
    t.equal(stripeInstance._loadScript.callCount, 1);
    t.equal(callback.callCount, 2);
    t.end();
  });

  tap.test('createToken', t => {
    t.autoend(true);

    function fakeData() {
      return {
        cardData: {
          name: 'Mr G Spinach',
          addressLine1: '1 Maple St',
          addressLine2: 'Right of Nowhere',
          addressCity: 'Somewhere',
          addressState: 'Left a bit',
          addressZip: '70130',
          addressCountry: 'North of the border'
        },
        cardResponse: {
          token: {
            id: 'tok_8DPg4qjJ20F1aM',
            card: {
              name: null,
              address_line1: '12 Main Street',
              address_line2: 'Apt 42',
              address_city: 'Palo Alto',
              address_state: 'CA',
              address_zip: '94301',
              address_country: 'US',
              country: 'US',
              exp_month: 2,
              exp_year: 2018,
              last4: '4242',
              object: 'card',
              brand: 'Visa',
              funding: 'credit'
            },
            created: 1490567830,
            livemode: true,
            type: 'card',
            object: 'token',
            used: false
          }
        }
      };
    }

    t.test('can create a token', t => {
      const {cardData, cardResponse} = fakeData();
      const {fakeStripe} = setupFakes();
      fakeStripe.createToken = sinon.stub().returns({
        then: sinon.stub().callsArgWith(0, cardResponse)
      });
      const stripeInstance = new stripe('http://example.com/');
      stripeInstance.stripe = fakeStripe;
      stripeInstance.createToken({card: 'data'}, cardData, sinon.stub());
      t.equal(fakeStripe.createToken.callCount, 1);
      t.deepEqual(fakeStripe.createToken.args[0][0], {card: 'data'});
      t.deepEqual(fakeStripe.createToken.args[0][1], {
        name: 'Mr G Spinach',
        address_line1: '1 Maple St',
        address_line2: 'Right of Nowhere',
        address_city: 'Somewhere',
        address_state: 'Left a bit',
        address_zip: '70130',
        address_country: 'North of the border'
      });
      t.end();
    });

    t.test('can return the token data', t => {
      const {cardData, cardResponse} = fakeData();
      const {fakeStripe} = setupFakes();
      fakeStripe.createToken = sinon.stub().returns({
        then: sinon.stub().callsArgWith(0, cardResponse)
      });
      const stripeInstance = new stripe('http://example.com/');
      stripeInstance.stripe = fakeStripe;
      const callback = sinon.stub();
      stripeInstance.createToken({}, cardData, callback);
      t.equal(callback.callCount, 1);
      t.equal(callback.args[0][0], null);
      t.deepEqual(callback.args[0][1], {
        id: 'tok_8DPg4qjJ20F1aM',
        card: {
          name: null,
          addressLine1: '12 Main Street',
          addressLine2: 'Apt 42',
          addressCity: 'Palo Alto',
          addressState: 'CA',
          addressZip: '94301',
          addressCountry: 'US',
          country: 'US',
          expMonth: 2,
          expYear: 2018,
          last4: '4242',
          object: 'card',
          brand: 'Visa',
          funding: 'credit'
        },
        created: 1490567830,
        livemode: true,
        type: 'card',
        object: 'token',
        used: false
      });
      t.end();
    });

    t.test('handles errors when getting a user', t => {
      const {cardData} = fakeData();
      const {fakeStripe} = setupFakes();
      fakeStripe.createToken = sinon.stub().returns({
        then: sinon.stub().callsArgWith(0, {
          error: {
            type: 'card_error',
            code: 'invalid_expiry_year',
            message: 'Your card\'s expiration year is invalid.',
            param: 'exp_year'
          }
        })
      });
      const stripeInstance = new stripe('http://example.com/');
      stripeInstance.stripe = fakeStripe;
      const callback = sinon.stub();
      stripeInstance.createToken({}, cardData, callback);
      t.equal(callback.callCount, 1);
      t.equal(callback.args[0][0],
        'Your card\'s expiration year is invalid.');
      t.equal(callback.args[0][1], null);
      t.end();
    });
  });

  tap.test('createCardElement', t => {
    t.autoend(true);

    t.test('can create a card element', t => {
      const {fakeStripe} = setupFakes();
      const callback = sinon.stub();
      const create = sinon.stub().returns({
        created: 'created'
      });
      fakeStripe.elements = sinon.stub().returns({
        create: create
      });
      const stripeInstance = new stripe('http://example.com/');
      stripeInstance.stripe = fakeStripe;
      stripeInstance.createCardElement(callback);
      t.equal(create.callCount, 1);
      t.equal(callback.callCount, 1);
      t.deepEqual(callback.args[0][0], {
        created: 'created'
      });
      t.end();
    });
  });
});
