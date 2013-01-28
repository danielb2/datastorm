require "./_helper"

describe "Dataset", ->
  subject = null
  beforeEach (done) ->
    subject = new Sequel.mysql
    done()

  it "should do plain query", ->
    dataset = subject.ds('generic_items')
    dataset.sql().should.equal "SELECT * FROM generic_items"

  it "should limit", ->
    dataset = subject.ds('generic_items')
    dataset.limit(3).sql().should.equal "SELECT * FROM generic_items LIMIT 3"

  it "should do simple filter", ->
    dataset = subject.ds('generic_items')
    dataset.where({title: 'mountain dew'}).sql().should.equal "SELECT * FROM generic_items WHERE title='mountain dew'"

  it "should filter multiple items", ->
    dataset = subject.ds('generic_items')
    dataset.where({title: 'mountain dew', id: 123}).sql().should.equal "SELECT * FROM generic_items WHERE title='mountain dew' AND id='123'"

  it "be chainable", ->
    dataset = subject.ds('generic_items')
    dataset.where({title: 'mountain dew'}).where({id: 123}).sql().should.equal "SELECT * FROM generic_items WHERE title='mountain dew' AND id='123'"

  it "be stateless chainable", ->
    dataset = subject.ds('generic_items')
    dataset.where({id: 123})
    dataset.where({title: 'mountain dew'}).sql().should.equal "SELECT * FROM generic_items WHERE title='mountain dew'"

  it.skip "should create table", (done) ->
    subject.create_table 'generic_items', (handle) ->
      handle.add 'primary_key', 'id'
      handle.add 'name', 'String'

  it.skip "should do things", (done) ->
    dataset = subject['generic_items']
    dataset.insert({name: "Mountain Dew"})

  it.skip "should print out the number of items", (done) ->
    dataset = subject['generic_items']
    dataset.count()

  it.skip "should get all record", ->
    dataset = subject['generic_items']
    records = dataset.all()

  it.skip "should iterate over recrods", ->
    dataset = subject['generic_items']
    dataset.each (record) ->
      console.log record



describe "Models", ->
  subject = null
  beforeEach (done) ->
    subject = new Sequel.mock
    done()


  it.skip "should allow to define a model", ->
    School = Sequel.Model.extend (_super) ->
      @hasMany 'lists'
      @validates "name", format: { with: /\A[a-zA-Z]+\z/, message: "Only letters allowed" }


class Blah

class Foo extends Blah
