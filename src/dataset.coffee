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
    sql = "SELECT * FROM #{@tableName}"
    sql += " WHERE " + whereClause.join(' AND ') if @clause.where
    return sql

module.exports = @dataset
