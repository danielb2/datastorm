var internals = {};


internals.DataStorm = {};

internals.DataStorm.models = {};

internals.DataStorm.dataset = require('./dataset');

internals.DataStorm.validation = require('./validation');

internals.DataStorm.mysql = require('./mysql')(internals.DataStorm);

internals.DataStorm.mock = require('./mock')(internals.DataStorm);

internals.DataStorm.Model = require('./model')(internals.DataStorm);

internals.DataStorm.VERSION = require('../package.json').version;

internals.DataStorm.model = function (name, db) {

    var __hasProp = {}.hasOwnProperty;
    var __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

    var Model = (function(_super) {
        __extends(Model, _super);

        function Model() {
            return Model.__super__.constructor.apply(this, arguments);
        }

        Model.db = db;
        Model._name = name;
        internals.DataStorm.models[Model.model_name()] = Model;
        return Model;

    })(internals.DataStorm.Model);

    return Model;

};

module.exports = internals.DataStorm;
