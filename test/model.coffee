require "./_helper"


DB = new Sequel.mysql {username: 'root', password: '', host: 'localhost', database: 'classrooms_development'}
class List extends Sequel.Model

describe "Model", ->
  db = null
  beforeEach (done) ->
    done()

  it "should allow to define a model", ->
    List.table_name().should.equal 'lists'
