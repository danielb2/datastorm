
lingo = require 'lingo'
class @Model
  constructor:  ->
    console.log 'created'

  @table_name: ->
    lingo.en.pluralize @name.toLowerCase()

  @find_sql: (id) ->
    dataset = @db.ds @table_name()
    dataset.where(id: id).sql()

module.exports = @Model
