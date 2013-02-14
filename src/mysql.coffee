class @mysql
  constructor: (settings) ->
    mysql = require 'mysql'
    @connection = new mysql.createConnection
      host: settings.host || 'localhost'
      port: settings.port || 3306
      user: settings.username || ''
      password: settings.password || ''
      database: settings.database || ''

  ds: (name) ->
    new DataStorm.dataset(@connection, name)

module.exports = @mysql
