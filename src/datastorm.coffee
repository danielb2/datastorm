DataStorm = {}
DataStorm.models  = {}
DataStorm.dataset = require './dataset'
DataStorm.mysql   = require('./mysql')(DataStorm)
DataStorm.Model   = require('./model')(DataStorm)
DataStorm.VERSION = require('../package.json').version

module.exports = DataStorm
