'use strict';

const internals = {};


internals.DataStorm = {
    models: {},
    dataset: require('./dataset'),
    validation: require('./validation'),
    VERSION: require('../package.json').version
};

internals.DataStorm.mysql = require('./mysql')(internals.DataStorm);
internals.DataStorm.sqlite3 = require('./sqlite3')(internals.DataStorm);
internals.DataStorm.mock = require('./mock')(internals.DataStorm);
internals.DataStorm.Model = require('./model')(internals.DataStorm);

internals.DataStorm.model = function (name, db) {

    const __hasProp = {}.hasOwnProperty;
    const __extends = function (child, parent) {

        for (const key in parent) {
            if (__hasProp.call(parent, key)) {
                child[key] = parent[key];
            }
        }
        const ctor = function ctor() {

            this.constructor = child;
        };
        ctor.prototype = parent.prototype;
        child.prototype = new ctor();
        child.__super__ = parent.prototype;
        return child;
    };

    const Model = (function (_super) {

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
