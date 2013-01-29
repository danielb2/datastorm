
lingo = require 'lingo'
class @Model
  constructor: (attributes) ->
    @attributes = attributes
    for name, value of attributes
      @[name] = value

  @table_name: ->
    lingo.en.pluralize @name.toLowerCase()

  @find_query: (id) ->
    dataset = @db.ds @table_name()
    dataset.where(id: id)

  @find_sql: (id) ->
    @find_query(id).sql()

  @find: (id, cb) ->
    @find_query(id).first(cb)

  @first: (cb) ->
    dataset = @db.ds @table_name()
    dataset.first (err, result) =>
      cb err, new @(result)

module.exports = @Model
