class @dataset
  constructor: (tableName) ->
    @tableName = tableName
    @clause    = {}

  merge: (obj1,obj2) ->
    obj3 = {}
    for i of obj1
      obj3[i] = obj1[i]
    for i of obj2
      obj3[i] = obj2[i]
    return obj3

  where: (conditions) ->
    @clause.where = if @clause.where then @merge(@clause.where, conditions) else conditions
    @

  sql: ->
    whereClause = []
    for k, v of @clause.where
      whereClause.push "#{k}='#{v}'"
    sql = "SELECT * FROM #{@tableName}"
    sql += " WHERE " + whereClause.join(' AND ') if @clause.where
    return sql

module.exports = @dataset
