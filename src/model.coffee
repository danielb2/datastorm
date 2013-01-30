lingo = require 'lingo'
class @Model
  @relations  = {}
  constructor: (klass, attributes) ->
    @klass      = klass
    @attributes = attributes
    @set_relations()
    for name, value of attributes
      @[name] = value

  set_relations: ->
    for relation in @klass.relations.has_many
      dataset = relation.dataset()
      relation_name = relation.table_name()
      conditions = {}
      # items.list_id=lists.id
      conditions['id'] = lingo.en.singularize(@klass.name).toLowerCase() + "_id"
      handle =  dataset.join(@klass.table_name(), conditions)
      @[relation_name] = ->
        handle

  table_name: ->
    @klass.table_name()

  @has_many: (relation) ->
    model_name = lingo.capitalize(lingo.en.singularize(relation))
    model = Sequel.models[model_name]
    if @relations.has_many then @relations.has_many.push model else @relations.has_many = [model]

  @table_name: ->
    lingo.en.pluralize @name.toLowerCase()

  @find_query: (id) ->
    dataset = @db.ds @table_name()
    dataset.where(id: id)

  @find_sql: (id) ->
    @find_query(id).sql()

  @find: (id, cb) ->
    @find_query(id).first(cb)

  @dataset: ->
    @db.ds @table_name()

  @first: (cb) ->
    dataset = @db.ds @table_name()
    dataset.first (err, result) =>
      cb err, new @(@,result)

module.exports = @Model
