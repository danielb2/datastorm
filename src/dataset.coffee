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
    if toString.call(conditions) == '[object String]'
      new_where = if @clause.where_strings then @clause.where_strings.push(conditions); @clause.where_strings else [conditions]
      return @clone({where_strings: new_where})
    else
      new_where = if @clause.where then @merge(@clause.where, conditions) else conditions
      return @clone({where: new_where})

  limit: (num) ->
    new_obj = @clone({limit: num})
    return new_obj

  order: (order) ->
    return @clone({order: order})

  group: (group) ->
    return @clone({group: group})

  sql: ->
    whereClause = []
    for k, v of @clause.where
      if toString.call(v) == '[object Array]'
        out = JSON.stringify(v).replace(/"/g,'\'','gi').replace(/[\[\]]/g,'')
        whereClause.push "#{k} IN(#{out})"
      else
        whereClause.push "#{k}='#{v}'"
    if @clause.where_strings
      for k in @clause.where_strings
        whereClause.push k
    sql = "SELECT * FROM #{@tableName}"
    sql += " WHERE " + whereClause.join(' AND ') if whereClause.length > 0
    sql += " ORDER BY #{@clause.order}" if @clause.order
    sql += " GROUP BY #{@clause.group}" if @clause.group
    sql += " LIMIT #{@clause.limit}" if @clause.limit
    return sql

module.exports = @dataset
