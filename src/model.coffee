
lingo = require 'lingo'
class @Model
  constructor:  ->
    console.log 'created'

  @table_name: ->
    lingo.en.pluralize @name.toLowerCase()

module.exports = @Model
