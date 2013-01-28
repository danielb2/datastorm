class @dataset
  constructor: (tableName) ->
    @tableName = tableName
    @clause    = {}

  # @private
  merge: (obj1,obj2) ->
    obj3 = {}
    for i of obj1
      obj3[i] = obj1[i]
    for i of obj2
      obj3[i] = obj2[i]
    return obj3

  clone: (additions) ->
    new_obj = @merge(@,{})
    new_obj.clause = @merge(@clause,additions)
    return new_obj

  where: (conditions) ->
    new_obj = @clone(@)
    new_obj.clause.where = if @clause.where then @merge(@clause.where, conditions) else conditions
    return new_obj

  sql: ->
    whereClause = []
    for k, v of @clause.where
      whereClause.push "#{k}='#{v}'"
    sql = "SELECT * FROM #{@tableName}"
    sql += " WHERE " + whereClause.join(' AND ') if @clause.where
    return sql

module.exports = @dataset
