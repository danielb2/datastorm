require "./_helper"


DB = new Sequel.mysql {username: 'root', password: '', host: 'localhost', database: 'sequel_test'}
class List extends Sequel.Model
  @db = DB

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
    List.first (err, list) ->
      list.table_name().should.equal 'lists'
      list.id.should.equal 51
      list.name.should.equal 'a list'
      done()
