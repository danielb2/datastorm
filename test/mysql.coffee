require "./_helper"


DB = new Sequel.mysql {username: 'root', password: '', host: 'localhost', database: 'sequel_test'}

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
