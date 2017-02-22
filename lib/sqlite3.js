'use strict';

module.exports = function (DataStorm) {

    const sqlite3 = function mysql(filename) {

        const Sqlite3 = require('sqlite3');
        this.connection = new Sqlite3.Database(filename);
    };

    sqlite3.prototype.ds = function (name) {

        class SqliteDS extends DataStorm.dataset {

            query(sql, cb) {

                if (process.env.DEBUG) {
                    console.log(sql);
                }

                if (sql.match(/select/i)) {
                    return this.connection.all(sql, (err, result) => {

                        return cb(err, result);
                    });
                }

                return this.connection.run(sql, function (err, results, fields) {

                    return cb(err, { insertId: this.lastID, affectedRows: this.changes }, fields);
                });

            };
        }

        return new SqliteDS(this.connection, name);
    };

    return sqlite3;
};
