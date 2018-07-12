/* Copyright (C) 2018 Canonical Ltd. */

'use strict';

const bundleService = require('./lib/bundleservice');
const charmstore = require('./lib/charmstore');
const identity = require('./lib/identity');
const payment = require('./lib/payment');
const plans = require('./lib/plans');
const rates = require('./lib/rates');
const stripe = require('./lib/stripe');
const terms = require('./lib/terms');
const urls = require('./lib/urls');

module.exports = {
  bundleService,
  charmstore,
  identity,
  payment,
  plans,
  rates,
  stripe,
  terms,
  urls
};
