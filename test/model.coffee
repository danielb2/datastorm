require "./_helper"


DB = new Sequel.mysql {username: 'root', password: '', host: 'localhost', database: 'classrooms_development'}
class List extends Sequel.Model
  @db = DB

describe "Model", ->
  db = null
  beforeEach (done) ->
    done()

  it "should allow to define a model", ->
    List.table_name().should.equal 'lists'

  it "should find a record", ->
    List.find_sql(123).should.equal "SELECT * FROM lists WHERE id='123'"
