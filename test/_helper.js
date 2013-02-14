process.env.NODE_ENV = 'test';

require('coffee-script');
DataStorm = require('../src/datastorm.coffee');
require('chai').should();
// chai.Assertion.includeStack = true; // defaults to false
