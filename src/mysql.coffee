class @mysql
  constructor: () ->

  ds: (name) ->
    new Sequel.dataset(name)

module.exports = @mysql
