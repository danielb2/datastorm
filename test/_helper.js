process.env.NODE_ENV = 'test';

require('coffee-script');
DataStorm = require('../lib/datastorm');
require('chai').should();
// chai.Assertion.includeStack = true; // defaults to false
