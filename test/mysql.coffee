require "./_helper"


DB = new Sequel.mysql {username: 'root', password: '', host: 'localhost', database: 'sequel_test'}

class Sequel.models.Item extends Sequel.Model
  @db = DB

class Sequel.models.List extends Sequel.Model
  @db = DB
  @one_to_many 'items'

describe "Mysql", ->
  db = null
  beforeEach (done) ->
    done()

  it "should the first record", (done) ->
    ds = DB.ds('lists')
    ds.first (err, row) ->
      row.id.should.equal 51
      row.name.should.equal 'a list'
      done()

  it "should the first record as a model", (done) ->
    Sequel.models.List.first (err, list) ->
      list.table_name().should.equal 'lists'
      list.id.should.equal 51
      list.name.should.equal 'a list'
      done()

  it "should fire the row_proc method for each record", (done) ->
    ds = DB.ds('lists')
    rows = []
    ds.set_row_func (result) ->
      return new Sequel.models.List result

    ds.first (err, row) ->
      row.table_name().should.equal 'lists'
      done()

  it "should link to first record through model", (done) ->
    Sequel.models.List.first (err, list) ->
      list.items.first (err, item) ->
        item.name.should.equal 'an item'
        item.constructor.name.should.equal 'Item'
        item.id.should.equal 42
        item.table_name().should.equal 'items'
        done()

  it "should link to records through model", (done) ->
    Sequel.models.List.first (err, list) ->
      list.items.all (err, items) ->
        item = items[0]
        item.name.should.equal 'an item'
        item.constructor.name.should.equal 'Item'
        item.id.should.equal 42
        item.table_name().should.equal 'items'
        done()
