module.exports = (DataStorm) ->
  class @mysql
    constructor: (settings) ->
      @queries = []
      @connection =
        query: (sql, cb) =>
          @queries.push sql
          cb(1)

    reset: ->
      @queries = []

    ds: (name) ->
      new DataStorm.dataset(@connection, name)
