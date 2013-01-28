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
    new_where = if @clause.where then @merge(@clause.where, conditions) else conditions
    return @clone({where: new_where})

  limit: (num) ->
    new_obj = @clone({limit: num})
    return new_obj

  order: ->

  group: ->

  sql: ->
    whereClause = []
    for k, v of @clause.where
      whereClause.push "#{k}='#{v}'"
    sql = "SELECT * FROM #{@tableName}"
    sql += " WHERE " + whereClause.join(' AND ') if @clause.where
    sql += " LIMIT #{@clause.limit}" if @clause.limit
    return sql

module.exports = @dataset
