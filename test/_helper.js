process.env.NODE_ENV = 'test';

DataStorm = require('../lib/datastorm');
require('chai').should();
// chai.Assertion.includeStack = true; // defaults to false
