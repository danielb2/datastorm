require "./_helper"

describe "Dataset", ->
  db = new DataStorm.mysql {username: 'root', password: '', host: 'localhost', database: 'datastorm_test'}
  dataset = db.ds('items')
  beforeEach (done) -> 
    done()

  it "should do plain query", ->
    dataset.sql().should.equal "SELECT * FROM `items`"

  it "should limit", ->
    dataset.limit(3).sql().should.equal "SELECT * FROM `items` LIMIT 3"

  it "should limit with offset", ->
    dataset.limit(3, 10).sql().should.equal "SELECT * FROM `items` LIMIT 3 OFFSET 10"

  it "should offset", ->
    dataset.limit(null, 10).sql().should.equal "SELECT * FROM `items` OFFSET 10"

  it "should order", ->
    dataset.order('id asc').sql().should.equal "SELECT * FROM `items` ORDER BY `id asc`"

  it "should group", ->
    dataset.group('name').sql().should.equal "SELECT * FROM `items` GROUP BY `name`"

  it "should do simple filter", ->
    dataset.where({title: 'mountain dew'}).sql().should.equal "SELECT * FROM `items` WHERE title='mountain dew'"

  it "should filter multiple items", ->
    dataset.where({title: 'mountain dew', id: 123}).sql().should.equal "SELECT * FROM `items` WHERE title='mountain dew' AND id='123'"

  it "be chainable", ->
    dataset.where({title: 'mountain dew'}).where({id: 123}).sql().should.equal "SELECT * FROM `items` WHERE title='mountain dew' AND id='123'"

  it "be stateless chainable", ->
    dataset.where({id: 123})
    dataset.where({title: 'mountain dew'}).sql().should.equal "SELECT * FROM `items` WHERE title='mountain dew'"

  it "should use in for where array", ->
    dataset.where({id: [1,2,3]}).sql().should.equal "SELECT * FROM `items` WHERE `id` IN(1,2,3)"

  it "should use in for where string array", ->
    dataset.where({name: ['one','two']}).sql().should.equal "SELECT * FROM `items` WHERE `name` IN('one','two')"

  it "should be able to define our own WHERE", ->
    dataset.where("created_at='whatever'").sql().should.equal "SELECT * FROM `items` WHERE created_at='whatever'"

  it "should be able to define our own WHERE with chains", ->
    dataset.where({title: 'mountain dew'}).where("created_at='whatever'").sql().should.equal "SELECT * FROM `items` WHERE title='mountain dew' AND created_at='whatever'"

  it "should join two tables with ON clause", ->
    dataset.join('order_items', {item_id: 'id'}).where({order_id: 1234}).sql().should.
      equal "SELECT * FROM `items` INNER JOIN `order_items` ON (`order_items`.`item_id`=`items`.`id`) WHERE order_id='1234'"

  it "should straight join two tables", ->
    dataset.join('order_items').sql().should.
      equal "SELECT * FROM `items` INNER JOIN `order_items`"

  it.skip "should chain joins tables", ->
    dataset = db.ds('lists')
    dataset.join('items', ).join('tags').sql().should.
      equal "SELECT * FROM `lists` INNER JOIN `items` INNER JOIN `tags`"

  it "should delete", ->
    dataset.delete_sql().should.equal 'DELETE * FROM `items`'

  it "should delete join", ->
    dataset.join('flowers').delete_sql().should.equal 'DELETE `items` FROM `items` INNER JOIN `flowers`'

  it "should update join", ->
    dataset.join('flowers').update_sql().should.equal 'UPDATE `items` INNER JOIN `flowers` SET '

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
    db.create_table 'items', (handle) ->
      handle.add 'primary_key', 'id'
      handle.add 'name', 'String'

  it.skip "should iterate over recrods", ->
    dataset.each (record) ->
      console.log record

