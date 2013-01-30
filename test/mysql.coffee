require "./_helper"


DB = new Sequel.mysql {username: 'root', password: '', host: 'localhost', database: 'sequel_test'}

class Sequel.models.Item extends Sequel.Model
  @db = DB

class Sequel.models.List extends Sequel.Model
  @db = DB
  @has_many 'items'

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

  it.skip "should link to records through model", (done) ->
    Sequel.models.List.first (err, list) ->
      list.items.first (err, item) ->
        item.name.should.equal 'an item'
        item.id.should.equal 42
        item.table_name().should.equal 'items'
        done()
