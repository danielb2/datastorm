require "./_helper"


DB = new Sequel.mysql {username: 'root', password: '', host: 'localhost', database: 'sequel_test'}
class List extends Sequel.Model
  @db = DB
  @one_to_many 'items'
  @one_to_many 'tags', {key: 'label_id'}

  @validate 'age', (value, done) ->
    # console.log 'this has to be executed ' + value
    @errors.add value, 'Not of type number' unless typeof value == 'number'
    done()

  @validate 'first_name', (value, done) ->
    # console.log 'first_name'
    @errors.add value, 'We dont allow Debra' if value == 'debra'
    done()

describe "Model", ->
  db = null
  beforeEach (done) ->
    done()

  it "should get the correct one_to_many sql", (done) ->
    list = new List
    list.id = 3
    list.items().sql().should.equal "SELECT * FROM `items` WHERE (`items`.`list_id` = 3)"
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

  it "should limit with offset", ->
    List.limit(5, 10).sql().should.equal "SELECT * FROM `lists` LIMIT 5 OFFSET 10"

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

  it "should update data for instance", ->
    class Character extends Sequel.Model
      @db = DB
    Character.where(id: 3).update_sql({first_name: 'walter', last_name: 'bishop', age: 64}).should.
      equal "UPDATE `characters` SET `first_name` = 'walter', `last_name` = 'bishop', `age` = 64 WHERE id='3'"

  it "should return true if model instance is new", ->
    class Character extends Sequel.Model
      @db = DB
    character = new Character title: 'foo'
    character.new.should.equal true

  it "should validate fields", (done) ->
    list = new List age: 23, last_name: 'morgan', first_name: 'dexter'
    list.validate (err) ->
      toString.call(err).should.equal '[object Null]'
      done()


  it "should fail validate fields with bad value", (done) ->
    list = new List age: 'twenty three', last_name: 'morgan', first_name: 'dexter'
    list.validate (err) ->
      if toString.call(err) ==  '[object Null]'
        'This should not be null.'.should.equal ''
      err.should.equal 'Validations failed. Check obj.errors to see the errors.'
      done()

  it "should not save on failed validate", (done) ->
    list = new List age: 'twenty three', last_name: 'morgan', first_name: 'debra'
    list.save (err, id) ->
      err.should.exist
      list.errors.should.have.property.age
      list.errors.should.have.property.debra
      done()
