require "./_helper"


DB = new DataStorm.mysql {username: 'root', password: '', host: 'localhost', database: 'datastorm_test'}

class List extends DataStorm.Model
  @db = DB
  @one_to_many 'items'
  @one_to_many 'tags', {key: 'label_id'}

  @validate 'age', (name, value, done) ->
    # console.log 'this has to be executed ' + value
    @errors.add value, 'Not of type number' unless typeof value == 'number'
    done()

  @validate 'first_name', (name, value, done) ->
    # console.log 'first_name'
    @errors.add value, 'We dont allow Debra' if value == 'debra'
    done()

class Tag extends DataStorm.Model
  @db = DB
class Item extends DataStorm.Model
  @db = DB

class GenericItem extends DataStorm.Model
  @db = DB

DataStorm.models =
  List: List
  Item: Item
  Tag: Tag
  GenericItem: GenericItem

describe "Model", ->
  db = null
  beforeEach (done) ->
    done()

  it "should ge tthe correct tablename for camelCased models",  ->
    GenericItem.table_name().should.equal 'generic_items'

  it "should get the correct model name for table name", ->
    gi = new GenericItem
    gi.to_model_name('generic_items').should.equal 'GenericItem'

  it "should get the correct one_to_many sql", (done) ->
    list = new List
    list.id = 3
    list.items().sql().should.equal "SELECT * FROM `items` WHERE (`items`.`list_id` = 3)"
    done()

  it "should get the correct one_to_many sql using keys", (done) ->
    list = new List
    list.id = 3
    list.tags().sql().should.equal "SELECT * FROM `tags` WHERE (`tags`.`label_id` = 3)"
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
    class Character extends DataStorm.Model
      @db = DB
    Character.insert_sql({first_name: 'walter', last_name: 'bishop', age: 64}).should.
      equal "INSERT INTO `characters` (`first_name`,`last_name`,`age`) VALUES ('walter','bishop',64)"

  it "should update data for instance", ->
    class Character extends DataStorm.Model
      @db = DB
    Character.where(id: 3).update_sql({first_name: 'walter', last_name: 'bishop', age: 64}).should.
      equal "UPDATE `characters` SET `first_name` = 'walter', `last_name` = 'bishop', `age` = 64 WHERE id='3'"

  it "should do a fulltext query", ->
    Item.where(name: 'keanu').full_text_search(['name','title'], 'matrix').sql().should.
      equal "SELECT * FROM `items` WHERE name='keanu' AND (MATCH (`name`,`title`) AGAINST ('matrix'))"

  it "should paginate", ->
    Item.where(name: 'coton de tulear').paginate(1,10).sql().should.
      equal "SELECT * FROM `items` WHERE name='coton de tulear' LIMIT 10 OFFSET 0"
    Item.where(name: 'coton de tulear').paginate(2,10).sql().should.
      equal "SELECT * FROM `items` WHERE name='coton de tulear' LIMIT 10 OFFSET 10"

  it "should delete data for instance", ->
    class Character extends DataStorm.Model
      @db = DB
    Character.where(id: 3).delete_sql().should.
      equal "DELETE * FROM `characters` WHERE id='3'"

  it "should return true if model instance is new", ->
    class Character extends DataStorm.Model
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

  it "should work with multiple associations", (done) ->
    mock_db = new DataStorm.mock
    class Song extends DataStorm.Model
      @db = mock_db
      @many_to_one 'album'
      @many_to_one 'artist'

    class Album extends DataStorm.Model
      @db = mock_db
    class Artist extends DataStorm.Model
      @db = mock_db
    DataStorm.models['Song'] = Song
    DataStorm.models['Album'] = Album
    DataStorm.models['Artist'] = Artist
    song = new Song name: 'hey ya', artist_id: 1, album_id: 2, id: 3
    try
      song.album()
    catch e
      mock_db.queries[0].should.
        equal "SELECT albums.* FROM `albums` INNER JOIN `songs` ON (`songs`.`album_id`=`albums`.`id`) WHERE songs.id='3' LIMIT 1"
      done()
