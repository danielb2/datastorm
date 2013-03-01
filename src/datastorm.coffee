DataStorm            = {}
DataStorm.models     = {}
DataStorm.dataset    = require './dataset'
DataStorm.validation = require './validation'
DataStorm.mysql      = require('./mysql')(DataStorm)
DataStorm.mock       = require('./mock')(DataStorm)
DataStorm.Model      = require('./model')(DataStorm)
DataStorm.VERSION    = require('../package.json').version

module.exports = DataStorm
