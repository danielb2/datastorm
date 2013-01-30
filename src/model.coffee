lingo = require 'lingo'
class @Model
  @relations  = {}
  @opts    = null
  constructor: (attributes) ->
    @attributes = attributes
    @set_relations()
    for name, value of attributes
      @[name] = value

  row_func: (result) ->
    new @constructor result

  # @private
  set_relations: ->
    for relation in @constructor.relations.one_to_many
      dataset = relation.dataset()
      relation_name = relation.table_name()
      conditions = {}
      conditions['id'] = lingo.en.singularize(@constructor.name).toLowerCase() + "_id"
      @[relation_name] = dataset.join(@constructor.table_name(), conditions).
        select(relation_name + ".*")

  @join: (table, conditions) ->
    @clone(@dataset().join(table, conditions))

  # @private
  @merge: (obj1,obj2) ->
    obj3 = {}
    for i of obj1
      obj3[i] = obj1[i]
    for i of obj2
      obj3[i] = obj2[i]
    return obj3

  # @private
  @clone: (dataset) ->
    if @dataset
      new_obj = @merge(@,{})
      new_obj.dataset = dataset
    else
      new_obj.dataset = @db.ds @table_name()
    return new_obj


  table_name: ->
    @constructor.table_name()

  @one_to_many: (relation) ->
    model_name = lingo.capitalize(lingo.en.singularize(relation))
    model = Sequel.models[model_name]
    if @relations.one_to_many then @relations.one_to_many.push model else @relations.one_to_many = [model]

  @table_name: ->
    lingo.en.pluralize @name.toLowerCase()

  @find_query: (id) ->
    @dataset().where(id: id)

  @find_sql: (id) ->
    @find_query(id).sql()

  @find: (id, cb) ->
    @find_query(id).first(cb)

  @dataset: ->
    dataset = @db.ds @table_name()
    dataset.set_row_func (result) =>
      new @ result
    return dataset

  @first: (cb) ->
    @dataset().first cb

module.exports = @Model
