DataStorm = {}
DataStorm.dataset = require './dataset'
DataStorm.mysql   = require('./mysql')(DataStorm)
DataStorm.models  = {}
DataStorm.Model   = require('./model')(DataStorm)
DataStorm.VERSION = require './version'

module.exports = DataStorm
