lingo = require 'lingo'
class @Model
  @relations = {}
  @opts      = {}
  constructor: (attributes) ->
    @attributes = attributes
    @set_relations()
    for name, value of attributes
      @[name] = value

  row_func: (result) ->
    new @constructor result

  # @private
  set_one_to_many_association: ->
    for association in @constructor.relations.one_to_many
      function_name = @_to_table_name(association)
      model_name    = @_to_model_name(association)
      @[function_name] = =>
        model = Sequel.models[model_name]
        join = {}
        join['id'] = lingo.en.singularize(@constructor.name).toLowerCase() + "_id"
        where = {}
        where[@constructor.table_name() + '.id'] = @id
        dataset = model.dataset().
          join(@constructor.table_name(), join).
          select(function_name + ".*").
          where(where)
        dataset

  # @private
  set_many_to_one_association: ->
    for relation in @constructor.relations.many_to_one
      model_name = @_to_model_name(relation)
      function_name = model_name.toLowerCase()
      @[function_name] = (cb) ->
        model = Sequel.models[model_name]
        join = {}
        join[function_name + '_id'] = 'id'
        where = {}
        where[@constructor.table_name() + '.id'] = @id
        dataset = model.dataset().select(model.table_name() + '.*').join(@constructor.table_name(), join).
          where(where)
        dataset.first cb

  set_many_to_many_association: ->
    for relation in @constructor.relations.many_to_one
      model_name = @_to_model_name(relation)
      function_name = model_name.toLowerCase()
      @[function_name] = (cb) ->
        model = Sequel.models[model_name]
        join = {}
        join[function_name + '_id'] = 'id'
        where = {}
        where[@constructor.table_name() + '.id'] = @id
        dataset = model.dataset().select(model.table_name() + '.*').join(@constructor.table_name(), join).
          where(where)
        dataset.first cb

  # @private
  set_relations: ->
    @set_one_to_many_association()
    @set_many_to_one_association()
    @set_many_to_many_association()

    # console.log @constructor.relations

  # @private
  _to_model_name: (name) ->
    lingo.capitalize(lingo.en.singularize(name))

  # @private
  _to_table_name: (name) ->
    lingo.en.pluralize(name).toLowerCase()

  # @private
  # create or use existing dataset
  @_dataset: ->
    if @opts['dataset']
      @opts['dataset']
    else
      @dataset()

  @join: (join_table, conditions) ->
    dataset = @_dataset().join(join_table,conditions)
    @clone({dataset: dataset})

  @select: (fields...) ->
    dataset = @_dataset().select(fields)
    @clone({dataset: dataset})

  @where: (conditions) ->
    dataset = @_dataset().where(conditions)
    @clone({dataset: dataset})

  @order: (order) ->
    dataset = @_dataset().order(order)
    @clone({dataset: dataset})

  @group: (group) ->
    dataset = @_dataset().group(group)
    @clone({dataset: dataset})

  @limit: (limit) ->
    dataset = @_dataset().limit(limit)
    @clone({dataset: dataset})

  @sql: ->
    if @opts['dataset']
      return @opts['dataset'].sql()
    else
      return @dataset().sql()


  # @private
  @merge: (obj1,obj2) ->
    obj3 = {}
    for i of obj1
      obj3[i] = obj1[i]
    for i of obj2
      obj3[i] = obj2[i]
    return obj3

  # @private
  @clone: (additions) ->
    new_obj = @merge(@,{})
    new_obj.opts = @merge(@opts,additions)
    return new_obj


  table_name: ->
    @constructor.table_name()

  @many_to_one: (relation) ->
    model_name = lingo.capitalize(lingo.en.singularize(relation))
    if @relations.many_to_one then @relations.many_to_one.push model_name else @relations.many_to_one = [model_name]

  @one_to_many: (relation) ->
    model_name = lingo.capitalize(lingo.en.singularize(relation))
    if @relations.one_to_many then @relations.one_to_many.push model_name else @relations.one_to_many =  [model_name]

  @many_to_many: (relation) ->
    model_name = lingo.capitalize(lingo.en.singularize(relation))
    if @relations.many_to_many then @relations.many_to_many.push model_name else @relations.many_to_many =  [model_name]

  # aliases for activerecord
  @has_many   = @one_to_many
  @belongs_to = @many_to_one

  @table_name: ->
    lingo.en.pluralize @name.toLowerCase()

  @find_query: (id) ->
    @_dataset().where(id: id)

  @find_sql: (id) ->
    @find_query(id).sql()

  @find: (id, cb) ->
    @find_query(id).first(cb)

  @insert_sql: (data) ->
    @dataset().insert_sql(data)
  @insert: (data) ->
    @dataset().insert(data)

  @update_sql: (data) ->
    @_dataset().update_sql(data)
  @update: (data) ->
    @_dataset().update(data)

  @all: (cb) ->
    @_dataset().all cb

  @count: (cb) ->
    @_dataset().count cb

  @dataset: ->
    dataset = @db.ds @table_name()
    dataset.set_row_func (result) =>
      new @ result
    return dataset

  @first: (cb) ->
    @_dataset().first cb

module.exports = @Model
