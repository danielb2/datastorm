require "./_helper"


DB = new Sequel.mysql {username: 'root', password: '', host: 'localhost', database: 'sequel_test'}

class Sequel.models.List extends Sequel.Model
  @db = DB
  @one_to_many 'items'
  @many_to_many 'tags'

class Sequel.models.Item extends Sequel.Model
  @db = DB
  @many_to_one 'list'

class Sequel.models.Tag extends Sequel.Model
  @db = DB
  @many_to_many 'lists'

describe "Mysql", ->
  beforeEach (done) ->
    {exec, spawn} = require('child_process')
    exec 'mysql -uroot sequel_test < test/sequel_test.sql', ->
      done()
  describe "Model", ->
    it "should the first record as a model", (done) ->
      Sequel.models.List.first (err, list) ->
        list.table_name().should.equal 'lists'
        list.id.should.equal 51
        list.name.should.equal 'a list'
        done()

    it "record retrieved should not be new", (done) ->
      Sequel.models.List.first (err, list) ->
        list.new.should.equal false
        done()

    it "should fire the row_proc method for each record", (done) ->
      ds = DB.ds('lists')
      rows = []
      ds.set_row_func (result) ->
        return new Sequel.models.List result

      ds.first (err, row) ->
        row.table_name().should.equal 'lists'
        done()

    it "should link to first record through one_to_many relationship", (done) ->
      Sequel.models.List.first (err, list) ->
        list.items().first (err, item) ->
          item.name.should.equal 'an item'
          item.constructor.name.should.equal 'Item'
          item.id.should.equal 42
          item.table_name().should.equal 'items'
          done()

    it "should link to records through one_to_many relationship", (done) ->
      Sequel.models.List.first (err, list) ->
        list.items().all (err, items) ->
          item = items[0]
          item.name.should.equal 'an item'
          item.constructor.name.should.equal 'Item'
          item.id.should.equal 42
          item.table_name().should.equal 'items'
          done()

    it "should link to records through many_to_one relationship", (done) ->
      Sequel.models.Item.find 42,  (err, item) ->
        item.name.should.equal 'an item'
        item.constructor.name.should.equal 'Item'
        item.list (err, list) ->
          list.constructor.name.should.equal 'List'
          list.id.should.equal 51
          list.name.should.equal 'a list'
          done()

    it "should find all", (done) ->
      Sequel.models.Item.all (err, items) ->
        items[0].name.should.equal 'another item'
        items[0].constructor.name.should.equal 'Item'
        items[1].name.should.equal 'an item'
        done()

    it "should count as model", (done) ->
      Sequel.models.Item.count (err, count) ->
        count.should.equal 2
        done()

    it.skip "should link to records through many_to_many relationship", (done) ->
      Sequel.models.Item.find 42,  (err, item) ->
        item.name.should.equal 'an item'
        item.constructor.name.should.equal 'Item'
        item.list (err, list) ->
          list.constructor.name.should.equal 'List'
          list.id.should.equal 51
          list.name.should.equal 'a list'
          done()


  describe "Dataset", ->
    it "should the first record", (done) ->
      ds = DB.ds('lists')
      ds.first (err, row) ->
        row.id.should.equal 51
        row.name.should.equal 'a list'
        done()

    it "should get all record", (done) ->
      dataset = DB.ds('items')
      dataset.all (err, items, fields) ->
        items[0].name.should.equal 'another item'
        items[1].name.should.equal 'an item'
        done()

    it "should count as ds", (done) ->
      dataset = DB.ds('items')
      dataset.count (err, count) ->
        count.should.equal 2
        done()

    it "should insert data", (done) ->
      dataset = DB.ds('items')
      dataset.insert {name: 'inserted item'}, (err, row_id) ->
        dataset.where(name: 'inserted item').all (err, results) ->
          results[0].name.should.equal 'inserted item'
          row_id.should.equal results[0].id
          done()

    it "should update data", (done) ->
      dataset = DB.ds('items')
      dataset.update {name: 'jesse pinkman'}, (err, affected_rows) ->
        dataset.where(name: 'jesse pinkman').all (err, results) ->
          results[0].name.should.equal 'jesse pinkman'
          affected_rows.should.equal results.length
          done()

