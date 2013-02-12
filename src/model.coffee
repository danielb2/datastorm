lingo = require 'lingo'
async = require 'async'
class Errors
  constructor: ->
    @errors = {}

  add: (name, msg) ->
    @errors[name] || @errors[name] = []
    @errors[name].push msg

  @prototype.__defineGetter__ 'length', ->
    errors = []
    for error of @errors
      errors.push error
    errors.length

class @Model
  constructor: (values) ->
    @values      = values
    @new         = true
    @set_associations()
    @errors      = {}
    for name, value of values
      @[name] = value

  @validate: (field_name, cb) ->
    @validations ||= {}
    @validations[field_name] ||= []
    @validations[field_name].push cb

  # run all the validations in parallel and collect errors at the end.
  validate: (cb) ->
    @errors = new Errors
    parallelize = []
    for field of @constructor.validations
      if @new or @has_column_changed(field)
        defer = (field) =>
          parallelize.push (done) => @validate_field field, done
        defer(field)

    async.parallel parallelize, (err, results) =>
      return cb null if @errors.length == 0
      return cb 'Validations failed. Check obj.errors to see the errors.'

  # @private
  # Each field can have multiple validations. Each is run in parallel
  validate_field: (field_name, cb) ->
    return unless @constructor.validations[field_name]
    parallelize = []
    for validation_function in @constructor.validations[field_name]
      unless validation_function
        @errors.add field_name, 'No validation function was specified'

      parallelize.push (done) => validation_function.bind(@) @[field_name], done
    async.parallel parallelize, cb

  row_func: (result) ->
    new @constructor result

  # @private
  set_one_to_many_association: ->
    for association in @constructor.associations.one_to_many
      defer = (association) =>
        function_name = @to_table_name(association)
        model_name    = @to_model_name(association)
        @[function_name] = =>
          model = Sequel.models[model_name]
          key_link = lingo.en.singularize(@constructor.name).toLowerCase() + "_id"
          where_str = "(`#{model.table_name()}`.`#{key_link}` = #{@id})"
          dataset = model.dataset().
            where(where_str)
          dataset
      defer(association)

  # @private
  set_many_to_one_association: ->
    for association in @constructor.associations.many_to_one
      model_name = @to_model_name(association)
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
  set_many_to_many_association: ->
    for association in @constructor.associations.many_to_many
      function_name = @to_table_name(association)
      model_name    = @to_model_name(association)
      @[function_name] = (cb) ->
        model = Sequel.models[model_name]
        join = {}
        join[lingo.en.singularize(function_name) + '_id'] = 'id'
        where = {}
        where[lingo.en.singularize(@constructor.table_name()) + '_id'] = @id
        join_table = [@constructor.table_name(), model.table_name()].sort().join('_')
        dataset = model.dataset().select(model.table_name() + '.*').join(join_table, join).
          where(where)
        dataset

  # @private
  set_associations: ->
    return unless @constructor.associations
    @set_one_to_many_association() if @constructor.associations.one_to_many
    @set_many_to_one_association() if @constructor.associations.many_to_one
    @set_many_to_many_association() if @constructor.associations.many_to_many

  # @private
  to_model_name: (name) ->
    lingo.capitalize(lingo.en.singularize(name))

  # @private
  to_table_name: (name) ->
    lingo.en.pluralize(name).toLowerCase()

  # @private
  # create or use existing dataset
  @_dataset: ->
    @opts ||= {}
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

  @limit: (limit, offset=null) ->
    dataset = @_dataset().limit(limit, offset)
    @clone({dataset: dataset})

  modified: ->
    return @new || !(@changed_columns().length == 0)

  has_column_changed: (field) ->
    for column in @changed_columns()
      return true if column == field
    return false

  changed_columns: ->
    return @values if @new # columns will have changed if it's a new obj
    changed = []
    for k, v of @values
      changed.push k if @[k] != v
    return changed

  save: (cb) ->
    return cb(false) unless @modified()
    validate = (callbk) =>
      @validate callbk
    command = null
    if @new
      command = (callbk) =>
        @constructor.insert @values, callbk
    else
      command = (callbk) =>
        updates = {}
        for change in @changed_columns()
          updates[change] = @values[change] = @[change]
        @constructor.update updates, callbk

    async.series {validate: validate, command: command}, (err, results) =>
      return cb err if err
      return cb err, results.command[0]
    @


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
    @associations ||= {}
    if @associations.many_to_one then @associations.many_to_one.push model_name else @associations.many_to_one = [model_name]

  @one_to_many: (relation) ->
    model_name = lingo.capitalize(lingo.en.singularize(relation))
    @associations ||= {}
    if @associations.one_to_many then @associations.one_to_many.push model_name else @associations.one_to_many =  [model_name]

  @many_to_many: (relation) ->
    model_name = lingo.capitalize(lingo.en.singularize(relation))
    @associations ||= {}
    if @associations.many_to_many then @associations.many_to_many.push model_name else @associations.many_to_many =  [model_name]

  # aliases for activerecord
  @has_many                = @one_to_many
  @belongs_to              = @many_to_one
  @has_and_belongs_to_many = @many_to_many

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

  @insert: (data, cb) ->
    @dataset().insert(data, cb)

  @update_sql: (data) ->
    @_dataset().update_sql(data)
  @update: (data, cb) ->
    @_dataset().update(data, cb)

  @all: (cb) ->
    @_dataset().all cb

  @count: (cb) ->
    @_dataset().count cb

  @dataset: ->
    dataset = @db.ds @table_name()
    dataset.set_row_func (result) =>
      model_instance = new @ result
      model_instance.new = false
      model_instance
    return dataset

  @first: (cb) ->
    @_dataset().first cb

module.exports = @Model
