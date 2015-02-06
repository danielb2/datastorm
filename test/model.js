var Code = require('code');
var Lab = require('lab');
var lab = exports.lab = Lab.script();

var describe = lab.describe;
var it = lab.it;
var before = lab.before;
var beforeEach = lab.beforeEach;
var after = lab.after;
var expect = Code.expect;

var __hasProp = {}.hasOwnProperty;
var __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

var Helper = require("./_helper");

var DB = new DataStorm.mysql({
    username: 'root',
    password: '',
    host: 'localhost',
    database: 'datastorm_test'
});

var List = (function(_super) {

    __extends(List, _super);

    function List() {
        return List.__super__.constructor.apply(this, arguments);
    }

    List.db = DB;

    List.one_to_many('items');

    List.one_to_many('generic_items');

    List.one_to_many('tags', {
        key: 'label_id'
    });

    List.validate('age', function(name, value, done) {
        if (typeof value !== 'number') {
            this.errors.add(name, 'Not of type number');
        }
        return done();
    });

    List.validate('first_name', function(name, value, done) {
        if (value === 'debra') {
            this.errors.add(name, 'We dont allow Debra');
        }
        return done();
    });

    return List;

})(DataStorm.Model);

var Tag = (function(_super) {
    __extends(Tag, _super);

    function Tag() {
        return Tag.__super__.constructor.apply(this, arguments);
    }

    Tag.db = DB;

    return Tag;

})(DataStorm.Model);

var Item = (function(_super) {
    __extends(Item, _super);

    function Item() {
        return Item.__super__.constructor.apply(this, arguments);
    }

    Item.db = DB;

    return Item;

})(DataStorm.Model);

var GenericItem = (function(_super) {
    __extends(GenericItem, _super);

    function GenericItem() {
        return GenericItem.__super__.constructor.apply(this, arguments);
    }

    GenericItem.db = DB;

    return GenericItem;

})(DataStorm.Model);

DataStorm.models = {
    List: List,
    Item: Item,
    Tag: Tag,
    GenericItem: GenericItem
};

describe("Model", function() {

    var db = null;

    it("should ge tthe correct tablename for camelCased models", function (done) {

        GenericItem.table_name().should.equal('generic_items');
        done();
    });

    it("should get the correct model name for table name", function (done) {

        List.associations.one_to_many[1].name.should.equal('GenericItem');
        done();
    });

    it("should get the correct one_to_many sql", function(done) {

        var list;
        list = new List;
        list.id = 3;
        list.items().sql().should.equal("SELECT * FROM `items` WHERE (`items`.`list_id` = 3)");
        done();
    });

    it("should get the correct one_to_many sql using keys", function(done) {

        var list;
        list = new List;
        list.id = 3;
        list.tags().sql().should.equal("SELECT * FROM `tags` WHERE (`tags`.`label_id` = 3)");
        done();
    });

    it("should get the correct table name", function (done) {

        List.table_name().should.equal('lists');
        done();
    });

    it("should find a record", function (done) {

        List.find_sql(123).should.equal("SELECT * FROM `lists` WHERE id='123'");
        done();
    });

    it("should do a join", function (done) {

        List.join('items', {
            list_id: 'id'
        }).sql().should.equal("SELECT * FROM `lists` INNER JOIN `items` ON (`items`.`list_id`=`lists`.`id`)");
        List.join('items').sql().should.equal("SELECT * FROM `lists` INNER JOIN `items`");
        done();
    });

    it("should do a where", function (done) {

        List.where({
            tv_show: 'Breaking Bad'
        }).sql().should.equal("SELECT * FROM `lists` WHERE tv_show='Breaking Bad'");
        done();
    });

    it("should order", function (done) {

        List.order('name desc').sql().should.equal("SELECT * FROM `lists` ORDER BY `name desc`");
        done();
    });

    it("should group", function (done) {

        List.group('name').sql().should.equal("SELECT * FROM `lists` GROUP BY `name`");
        done();
    });

    it("should limit", function (done) {

        List.limit(5).sql().should.equal("SELECT * FROM `lists` LIMIT 5");
        done();
    });

    it("should limit with offset", function (done) {

        List.limit(5, 10).sql().should.equal("SELECT * FROM `lists` LIMIT 5 OFFSET 10");
        done();
    });

    it("should select specific fields", function (done) {

        List.select('name', 'flower').sql().should.equal("SELECT name,flower FROM `lists`");
        done();
    });

    it("be chainable", function (done) {

        List.where({
            title: 'mountain dew'
        }).where({
            id: 123
        }).sql().should.equal("SELECT * FROM `lists` WHERE title='mountain dew' AND id='123'");
        done();
    });

    it("be stateless chainable", function (done) {

        List.where({
            id: 123
        });
        List.where({
            title: 'mountain dew'
        }).sql().should.equal("SELECT * FROM `lists` WHERE title='mountain dew'");
        done();
    });

    it("should insert data for instance", function (done) {

        var Character;
        Character = (function(_super) {

            __extends(Character, _super);

            function Character() {

                return Character.__super__.constructor.apply(this, arguments);
            }

            Character.db = DB;

            return Character;

        })(DataStorm.Model);
        Character.insert_sql({
            first_name: 'walter',
            last_name: 'bishop',
            age: 64
        }).should.equal("INSERT INTO `characters` (`first_name`,`last_name`,`age`) VALUES ('walter', 'bishop', 64)");
        done();
    });

    it("should update data for instance", function (done) {

        var Character;
        Character = (function(_super) {

            __extends(Character, _super);

            function Character() {

                return Character.__super__.constructor.apply(this, arguments);
            }

            Character.db = DB;

            return Character;

        })(DataStorm.Model);
        Character.where({
            id: 3
        }).update_sql({
            first_name: 'walter',
            last_name: 'bishop',
            age: 64
        }).should.equal("UPDATE `characters` SET `first_name` = 'walter', `last_name` = 'bishop', `age` = 64 WHERE id='3'");
        done();
    });

    it("should do a fulltext query", function (done) {

        Item.where({
            name: 'keanu'
        }).full_text_search(['name', 'title'], 'matrix').sql().should.equal("SELECT * FROM `items` WHERE name='keanu' AND (MATCH (`name`,`title`) AGAINST ('matrix'))");
        done();
    });

    it("should paginate", function (done) {

        Item.where({
            name: 'coton de tulear'
        }).paginate(1, 10).sql().should.equal("SELECT * FROM `items` WHERE name='coton de tulear' LIMIT 10 OFFSET 0");
        Item.where({
            name: 'coton de tulear'
        }).paginate(2, 10).sql().should.equal("SELECT * FROM `items` WHERE name='coton de tulear' LIMIT 10 OFFSET 10");
        done();
    });

    it("should delete data for instance", function (done) {

        var Character;
        Character = (function(_super) {

            __extends(Character, _super);

            function Character() {

                return Character.__super__.constructor.apply(this, arguments);
            }

            Character.db = DB;

            return Character;

        })(DataStorm.Model);
        Character.where({
            id: 3
        }).delete_sql().should.equal("DELETE * FROM `characters` WHERE id='3'");
        done();
    });

    it("should return true if model instance is new", function (done) {
        var Character, character;
        Character = (function(_super) {

            __extends(Character, _super);

            function Character() {

                return Character.__super__.constructor.apply(this, arguments);
            }

            Character.db = DB;

            return Character;

        })(DataStorm.Model);
        character = new Character({
            title: 'foo'
        });
        character["new"].should.equal(true);
        done();
    });

    it("should validate fields", function(done) {

        var list;
        list = new List({
            age: 23,
            last_name: 'morgan',
            first_name: 'dexter'
        });
        list.validate(function(err) {

            toString.call(err).should.equal('[object Null]');
            return done();
        });
    });

    it("should fail validate fields with bad value", function(done) {

        var list;
        list = new List({
            age: 'twenty three',
            last_name: 'morgan',
            first_name: 'dexter'
        });

        list.validate(function(err) {

            if (toString.call(err) === '[object Null]') {
                'This should not be null.'.should.equal('');
            }
            err.should.equal('Validations failed. Check obj.errors to see the errors.');
            done();
        });
    });

    it("should not save on failed validate", function(done) {

        var list;
        list = new List({
            age: 'twenty three',
            last_name: 'morgan',
            first_name: 'debra'
        });
        list.save(function(err, id) {
            err.should.exist;
            list.errors.should.have.property.age;
            list.errors.should.have.property.debra;
            done();
        });
    });

    it("should work with multiple associations", function(done) {

        var Album, Artist, Song, e, mock_db, song;
        mock_db = new DataStorm.mock;

        Song = (function(_super) {

            __extends(Song, _super);

            function Song() {

                return Song.__super__.constructor.apply(this, arguments);
            }

            Song.db = mock_db;

            Song.many_to_one('album');

            Song.many_to_one('artist');

            return Song;

        })(DataStorm.Model);

        Album = (function(_super) {

            __extends(Album, _super);

            function Album() {

                return Album.__super__.constructor.apply(this, arguments);
            }

            Album.db = mock_db;

            return Album;

        })(DataStorm.Model);

        Artist = (function(_super) {

            __extends(Artist, _super);

            function Artist() {

                return Artist.__super__.constructor.apply(this, arguments);
            }

            Artist.db = mock_db;

            return Artist;

        })(DataStorm.Model);
        DataStorm.models['Song'] = Song;
        DataStorm.models['Album'] = Album;
        DataStorm.models['Artist'] = Artist;
        song = new Song({
            name: 'hey ya',
            artist_id: 1,
            album_id: 2,
            id: 3
        });
        try {
            return song.album();
        } catch (_error) {
            e = _error;
            mock_db.queries[0].should.equal("SELECT * FROM `albums` WHERE albums.id='2' LIMIT 1");
            done();
        }
    });

    it("should work with polymorphic associations for one_to_many", function(done) {

        var Artist, Song, e, mock_db, song;
        mock_db = new DataStorm.mock;

        Song = (function(_super) {
            __extends(Song, _super);

            function Song() {
                return Song.__super__.constructor.apply(this, arguments);
            }

            Song.db = mock_db;

            Song.many_to_one('creator', {
                polymorphic: true
            });

            return Song;

        })(DataStorm.Model);

        Artist = (function(_super) {

            __extends(Artist, _super);

            function Artist() {

                return Artist.__super__.constructor.apply(this, arguments);
            }

            Artist.db = mock_db;

            return Artist;

        })(DataStorm.Model);
        DataStorm.models['Artist'] = Artist;
        DataStorm.models['Song'] = Song;
        song = new Song({
            creator_id: 23,
            creator_type: 'Artist',
            id: 14
        });
        try {
            return song.creator();
        } catch (_error) {
            e = _error;
            mock_db.queries[0].should.equal("SELECT * FROM `artists` WHERE artists.id='23' LIMIT 1");
            return done();
        }
    });

    it("should update model with key", function(done) {

        var Song, mock_db, song;
        mock_db = new DataStorm.mock;
        Song = (function(_super) {

            __extends(Song, _super);

            function Song() {

                return Song.__super__.constructor.apply(this, arguments);
            }

            Song.db = mock_db;

            return Song;

        })(DataStorm.Model);

        DataStorm.models['Song'] = Song;
        song = new Song({
            creator_id: 23,
            creator_type: 'Artist',
            id: 14
        });
        song["new"] = false;
        song.values.creator_id = 24;
        song.save(function(err, num) {

            mock_db.queries[0].should.equal("UPDATE `songs` SET `creator_id` = 23 WHERE id='14'");
            return done();
        });
    });

    it("should work with polymorphic associations for many_to_one", function(done) {

        var Artist, Song, artist, mock_db;
        mock_db = new DataStorm.mock;
        Song = (function(_super) {

            __extends(Song, _super);

            function Song() {

                return Song.__super__.constructor.apply(this, arguments);
            }

            Song.db = mock_db;

            return Song;

        })(DataStorm.Model);

        Artist = (function(_super) {

            __extends(Artist, _super);

            function Artist() {

                return Artist.__super__.constructor.apply(this, arguments);
            }

            Artist.db = mock_db;

            Artist.one_to_many('songs', {
                as: 'creator'
            });

            return Artist;

        })(DataStorm.Model);
        DataStorm.models['Artist'] = Artist;
        DataStorm.models['Song'] = Song;
        artist = new Artist({
            id: 99
        });
        artist.songs().sql().should.equal("SELECT * FROM `songs` WHERE (`songs`.`creator_id` = 99) AND (`songs`.`creator_type` = 'Artist')");
        return done();
    });
});
