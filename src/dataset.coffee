class @dataset
  constructor: (tableName) ->
    @tableName = tableName
    @clause    = {}

  where: (conditions) ->
    @clause.where = conditions
    @

  sql: ->
    whereClause = []
    for k, v of @clause.where
      whereClause.push "#{k}='#{v}'"

    "SELECT * FROM #{@tableName} WHERE " + whereClause.join('AND')
module.exports = @dataset
