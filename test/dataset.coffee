require "./_helper"

describe "Dataset", ->
  db = null
  beforeEach (done) ->
    db = new Sequel.mysql {username: 'root', password: '', host: 'localhost', database: 'classrooms_development'}
    done()

  it "should do plain query", ->
    dataset = db.ds('generic_items')
    dataset.sql().should.equal "SELECT * FROM `generic_items`"

  it "should limit", ->
    dataset = db.ds('generic_items')
    dataset.limit(3).sql().should.equal "SELECT * FROM `generic_items` LIMIT 3"

  it "should order", ->
    dataset = db.ds('generic_items')
    dataset.order('id asc').sql().should.equal "SELECT * FROM `generic_items` ORDER BY `id asc`"

  it "should group", ->
    dataset = db.ds('generic_items')
    dataset.group('name').sql().should.equal "SELECT * FROM `generic_items` GROUP BY `name`"

  it "should do simple filter", ->
    dataset = db.ds('generic_items')
    dataset.where({title: 'mountain dew'}).sql().should.equal "SELECT * FROM `generic_items` WHERE title='mountain dew'"

  it "should filter multiple items", ->
    dataset = db.ds('generic_items')
    dataset.where({title: 'mountain dew', id: 123}).sql().should.equal "SELECT * FROM `generic_items` WHERE title='mountain dew' AND id='123'"

  it "be chainable", ->
    dataset = db.ds('generic_items')
    dataset.where({title: 'mountain dew'}).where({id: 123}).sql().should.equal "SELECT * FROM `generic_items` WHERE title='mountain dew' AND id='123'"

  it "be stateless chainable", ->
    dataset = db.ds('generic_items')
    dataset.where({id: 123})
    dataset.where({title: 'mountain dew'}).sql().should.equal "SELECT * FROM `generic_items` WHERE title='mountain dew'"

  it "should use in for where array", ->
    dataset = db.ds('generic_items')
    dataset.where({id: [1,2,3]}).sql().should.equal "SELECT * FROM `generic_items` WHERE id IN(1,2,3)"

  it "should use in for where string array", ->
    dataset = db.ds('generic_items')
    dataset.where({name: ['one','two']}).sql().should.equal "SELECT * FROM `generic_items` WHERE name IN('one','two')"

  it "should be able to define our own WHERE", ->
    dataset = db.ds('generic_items')
    dataset.where("created_at='whatever'").sql().should.equal "SELECT * FROM `generic_items` WHERE created_at='whatever'"

  it "should be able to define our own WHERE with chains", ->
    dataset = db.ds('generic_items')
    dataset.where({title: 'mountain dew'}).where("created_at='whatever'").sql().should.equal "SELECT * FROM `generic_items` WHERE title='mountain dew' AND created_at='whatever'"

  it "should join two tables with ON clause", ->
    dataset = db.ds('items')
    dataset.join('order_items', {item_id: 'id'}).where({order_id: 1234}).sql().should.
      equal "SELECT * FROM `items` INNER JOIN `order_items` ON (`order_items`.`item_id`=`items`.`id`) WHERE order_id='1234'"

  it "should straight join two tables", ->
    dataset = db.ds('items')
    dataset.join('order_items').sql().should.
      equal "SELECT * FROM `items` INNER JOIN `order_items`"

  it "should allow to modify select", ->
    dataset = db.ds('posts')
    dataset.select('stamp', 'name').sql().should.equal "SELECT stamp, name FROM `posts`"

  it "should insert data", ->
    dataset = db.ds('posts')
    dataset.insert_sql(first_name: 'walter', last_name: 'bishop', age: 64).should.
      equal "INSERT INTO `posts` (`first_name`,`last_name`,`age`) VALUES ('walter','bishop',64)"

  it "should update data", ->
    dataset = db.ds('movies')
    dataset.join('characters').where({name: 'walter'}).update_sql({name: 'peter'}).should.
      equal "UPDATE `movies` INNER JOIN `characters` SET `name` = 'peter' WHERE name='walter'"

  it.skip "should create table", (done) ->
    db.create_table 'generic_items', (handle) ->
      handle.add 'primary_key', 'id'
      handle.add 'name', 'String'

  it.skip "should do things", (done) ->
    dataset = db['generic_items']
    dataset.insert({name: "Mountain Dew"})

  it.skip "should iterate over recrods", ->
    dataset = db['generic_items']
    dataset.each (record) ->
      console.log record

