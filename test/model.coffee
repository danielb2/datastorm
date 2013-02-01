require "./_helper"


DB = new Sequel.mysql {username: 'root', password: '', host: 'localhost', database: 'sequel_test'}
class List extends Sequel.Model
  @db = DB

describe "Model", ->
  db = null
  beforeEach (done) ->
    done()

  it "should get the correct table name", ->
    List.table_name().should.equal 'lists'

  it "should find a record", ->
    List.find_sql(123).should.equal "SELECT * FROM `lists` WHERE id='123'"

  it "should do a join", ->
    List.join('items', {list_id: 'id'}).sql().should.equal "SELECT * FROM `lists` INNER JOIN `items` ON (`items`.`list_id`=`lists`.`id`)"
    List.join('items').sql().should.equal "SELECT * FROM `lists` INNER JOIN `items`"

  it "should do a where", ->
    List.where(tv_show: 'Breaking Bad').sql().should.equal "SELECT * FROM `lists` WHERE tv_show='Breaking Bad'"

  it "should order", ->
    List.order('name desc').sql().should.equal "SELECT * FROM `lists` ORDER BY `name desc`"

  it "should group", ->
    List.group('name').sql().should.equal "SELECT * FROM `lists` GROUP BY `name`"

  it "should limit", ->
    List.limit(5).sql().should.equal "SELECT * FROM `lists` LIMIT 5"

  it "should select specific fields", ->
    List.select('name', 'flower').sql().should.equal "SELECT name,flower FROM `lists`"

  it "be chainable", ->
    List.where({title: 'mountain dew'}).where({id: 123}).sql().should.equal "SELECT * FROM `lists` WHERE title='mountain dew' AND id='123'"

  it "be stateless chainable", ->
    List.where({id: 123})
    List.where({title: 'mountain dew'}).sql().should.equal "SELECT * FROM `lists` WHERE title='mountain dew'"

  it "should insert data for instance", ->
    class Character extends Sequel.Model
      @db = DB
    Character.insert_sql({first_name: 'walter', last_name: 'bishop', age: 64}).should.
      equal "INSERT INTO `characters` (`first_name`,`last_name`,`age`) VALUES ('walter','bishop',64)"
