module.exports = function(DataStorm) {
    return this.mysql = (function() {

        function mysql(settings) {
            var mysql;
            mysql = require('mysql');
            this.connection = new mysql.createConnection({
                host: settings.host || 'localhost',
                port: settings.port || 3306,
                user: settings.username || '',
                password: settings.password || '',
                database: settings.database || ''
            });
        }

        mysql.prototype.ds = function(name) {
            return new DataStorm.dataset(this.connection, name);
        };

        return mysql;

    })();
};

