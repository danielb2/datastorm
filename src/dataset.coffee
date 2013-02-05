class @dataset
  constructor: (connection, tableName) ->
    @connection = connection
    @tableName  = tableName
    @clause     = {}

  # @private
  merge: (obj1,obj2) ->
    obj3 = {}
    for i of obj1
      obj3[i] = obj1[i]
    for i of obj2
      obj3[i] = obj2[i]
    return obj3

  # @private
  clone: (additions) ->
    new_obj = @merge(@,{})
    new_obj.clause = @merge(@clause,additions)
    return new_obj

  # @private
  # @param func [Function] - This function is called for each row returned from the call to the database
  set_row_func: (func) ->
    @row_func   = func

  # default function to call for each row in the database
  row_func: (row) ->
    return row


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

  join: (table_name, conditions) ->
    return @clone({join: {table_name: table_name, conditions: conditions}})

  query: (sql, cb) ->
    console.log sql if process.env.DEBUG
    @connection.query sql, cb

  all: (cb) ->
    @query @sql(), (err, result, fields) =>
      cb err, (@row_func res for res in result), fields

  first: (cb) ->
    @query @limit(1).sql(), (err, result, fields) =>
      cb err, (@row_func res for res in result)[0], fields

  count: (cb) ->
    @query @select('COUNT(*) as count').sql(), (err, result, fields) =>
      cb err, result[0].count, fields

  select: (fields...) ->
    return @clone({select: fields})


  # @private
  _build_join: ->
    join_query = "INNER JOIN `#{@clause.join.table_name}`"
    if @clause.join.conditions
      for k, v of @clause.join.conditions
        key = "`#{@clause.join.table_name}`.`#{k}`"
        value = "`#{@tableName}`.`#{v}`"
        return join_query + " ON (#{key}=#{value})"
    else
      return join_query

  insert_sql: (data) ->
    field_names = []
    field_values = []
    for k, v of data
      field_names.push k
      field_values.push v
    field_name_str  = @_stringify_field_names(field_names)
    field_value_str = @_stringify_field_values(field_values)
    sql = "INSERT INTO `#{@tableName}` (#{field_name_str}) VALUES (#{field_value_str})"

  insert: (data, cb) ->
    @query @insert_sql(data), (err, result, fields) =>
      cb err, result.insertId, fields

  update_sql: (data) ->
    setClause = []
    for k, v of data
      field_name_str  = @_stringify_field_names([k])
      field_value_str = @_stringify_field_values([v])
      setClause.push "#{field_name_str} = #{field_value_str}"

    whereClause = @_build_where()
    sql = "UPDATE `#{@tableName}`"
    sql += " " + @_build_join() if @clause.join
    sql += " SET " + setClause.join(', ')
    sql += " WHERE " + whereClause.join(' AND ') if whereClause.length > 0
    sql += " ORDER BY `#{@clause.order}`" if @clause.order
    sql += " LIMIT #{@clause.limit}" if @clause.limit

    return sql

  update: (data, cb) ->
    @query @update_sql(data), (err, result, fields) =>
      cb err, result.affectedRows, fields

  _stringify_field_names: (array) ->
    return JSON.stringify(array).replace(/"/g,'`','gi').replace(/[\[\]]/g,'')
  _stringify_field_values: (array) ->
    return JSON.stringify(array).replace(/"/g,'\'','gi').replace(/[\[\]]/g,'')

  _build_where: ->
    whereClause = []
    for k, v of @clause.where
      field_name_str  = @_stringify_field_names([k])
      field_value_str = @_stringify_field_values([v])
      if toString.call(v) == '[object Array]'
        whereClause.push "#{field_name_str} IN(#{field_value_str})"
      else
        whereClause.push "#{k}='#{v}'"
    if @clause.where_strings
      for k in @clause.where_strings
        whereClause.push k
    return whereClause

  sql: ->
    whereClause = @_build_where()
    sql = "SELECT "
    sql += if @clause.select then @clause.select.join(', ') else '*'
    # sql += if @clause.select then ("`#{x}`" for x in @clause.select).join(', ') else '*'
    sql += " FROM `#{@tableName}`"
    sql += " " + @_build_join() if @clause.join
    sql += " WHERE " + whereClause.join(' AND ') if whereClause.length > 0
    sql += " ORDER BY `#{@clause.order}`" if @clause.order
    sql += " GROUP BY `#{@clause.group}`" if @clause.group
    sql += " LIMIT #{@clause.limit}" if @clause.limit
    return sql

module.exports = @dataset
