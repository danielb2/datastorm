'use strict';

const Joi = require('joi');

const internals = {
    schema: {
        host: Joi.string().default('localhost').allow(''),
        port: Joi.number().integer().default(3306),
        username: Joi.string().default('').allow(''),
        password: Joi.string().default('').allow(''),
        database: Joi.string().required()
    }
};


module.exports = function (DataStorm) {

    const mysql = function mysql(settings) {

        const config = Joi.attempt(settings, internals.schema);
        config.user = config.username;
        delete config.username;
        const Mysql = require('mysql');
        this.connection = new Mysql.createConnection(config);
    };

    mysql.prototype.ds = function (name) {

        return new DataStorm.dataset(this.connection, name);
    };

    return mysql;
};
