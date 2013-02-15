require "./_helper"

describe "Model.Validations", ->
  db = new DataStorm.mysql {username: 'root', password: '', host: 'localhost', database: 'datastorm_test'}
  dataset = db.ds('items')
  beforeEach (done) -> 
    done()

  describe "validate presence", ->
    class Thing extends DataStorm.Model
      @validate 'name', DataStorm.validation.presence

    it "error if not present", (done) ->
      thing = new Thing
      thing.validate ->
        JSON.stringify(thing.errors).should.equal '{"name":["is not present"]}'
        done()

    it "no problem if present", (done) ->
      thing = new Thing
      thing.name = "naruto"
      thing.validate ->
        JSON.stringify(thing.errors).should.equal "{}"
        done()

  describe "validate email", ->
    class Thing extends DataStorm.Model
      @validate 'email', DataStorm.validation.email

    it "error if not present", (done) ->
      thing = new Thing
      thing.validate ->
        JSON.stringify(thing.errors).should.equal '{"email":["is not an email"]}'
        done()

    it "error if not valid", (done) ->
      thing = new Thing
      thing.email = "blah@foo"
      thing.validate ->
        JSON.stringify(thing.errors).should.equal '{"email":["is not an email"]}'
        done()

    it "fine if valid", (done) ->
      thing = new Thing
      thing.email = "blah@foo.com"
      thing.validate ->
        JSON.stringify(thing.errors).should.equal '{}'
        done()

