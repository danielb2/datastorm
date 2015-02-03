var internals = {};


internals.DataStorm = {};

internals.DataStorm.models = {};

internals.DataStorm.dataset = require('./dataset');

internals.DataStorm.validation = require('./validation');

internals.DataStorm.mysql = require('./mysql')(internals.DataStorm);

internals.DataStorm.mock = require('./mock')(internals.DataStorm);

internals.DataStorm.Model = require('./model')(internals.DataStorm);

internals.DataStorm.VERSION = require('../package.json').version;

module.exports = internals.DataStorm;
