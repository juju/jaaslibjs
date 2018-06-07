/* Copyright (C) 2018 Canonical Ltd. */

'use strict';

const bakery = require('./lib/bakery');
const bundleService = require('./lib/bundleservice');
const charmstore = require('./lib/charmstore');
const identity = require('./lib/identity');
const payment = require('./lib/payment');
const plans = require('./lib/plans');
const rates = require('./lib/rates');
const stripe = require('./lib/stripe');
const urls = require('./lib/urls');

module.exports = {
  bakery,
  bundleService,
  charmstore,
  identity,
  payment,
  plans,
  rates,
  stripe,
  urls
};
