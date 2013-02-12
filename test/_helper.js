process.env.NODE_ENV = 'test';

require('coffee-script');
Sequel = require('../src/sequel.coffee');
require('chai').should();
// chai.Assertion.includeStack = true; // defaults to false
