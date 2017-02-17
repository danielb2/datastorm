'use strict';

module.exports = function (DataStorm) {

    const mysql = function (settings) {

        this.queries = [];
        this.connection = {
            query: (sql, cb) => {

                this.queries.push(sql);
                return cb(null, { affectedRows: 1 });
            }
        };
    };

    mysql.prototype.reset = function () {

        this.queries = [];
    };

    mysql.prototype.ds = function (name) {

        return new DataStorm.dataset(this.connection, name);
    };

    return mysql;
};
