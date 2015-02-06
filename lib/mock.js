module.exports = function (DataStorm) {

    var mysql = function (settings) {

        var self = this;
        this.queries = [];
        this.connection = {
            query: function (sql, cb) {

                self.queries.push(sql);
                return cb(1);
            }
        };
    }

    mysql.prototype.reset = function () {

        return this.queries = [];
    };

    mysql.prototype.ds = function (name) {

        return new DataStorm.dataset(this.connection, name);
    };

    return mysql;
};
