'use strict';

const Code = require('code');
const DataStorm = require('../lib');
const Lab = require('lab');
const lab = exports.lab = Lab.script();

const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;

const DB = new DataStorm.mysql({
    username: 'root',
    password: '',
    host: 'localhost',
    database: 'datastorm_test'
});

const List = DataStorm.model('list', DB);

List.one_to_many('generic_items');

List.one_to_many('tags', {
    key: 'label_id'
});

List.validate('age', function (name, value, done) {

    if (typeof value !== 'number') {
        this.errors.add(name, 'Not of type number');
    }
    return done();
});

List.validate('first_name', function (name, value, done) {

    if (value === 'debra') {
        this.errors.add(name, 'We dont allow Debra');
    }
    return done();
});

const Item = DataStorm.model('item', DB);

const GenericItem = DataStorm.model('GenericItem', DB);

List.one_to_many(Item);

describe('Model', () => {

    it('should get the correct tablename for camelCased models', (done) => {

        GenericItem.table_name().should.equal('generic_items');
        done();
    });

    it('should get the correct model name for table name', (done) => {

        List.associations.one_to_many[0].name.should.equal('GenericItem');
        List.associations.one_to_many[1].name.should.equal('Tag');
        List.associations.one_to_many[2].name.should.equal('Item');
        done();
    });

    it('should get the correct one_to_many sql', (done) => {

        const list = new List();
        list.id = 3;
        list.items().sql().should.equal('SELECT * FROM `items` WHERE (`items`.`list_id` = 3)');
        done();
    });

    it('should get the correct one_to_many sql using keys', (done) => {

        const list = new List();
        list.id = 3;
        list.tags().sql().should.equal('SELECT * FROM `tags` WHERE (`tags`.`label_id` = 3)');
        done();
    });

    it('should get the correct table name', (done) => {

        List.table_name().should.equal('lists');
        done();
    });

    it('should find a record', (done) => {

        List.find_sql(123).should.equal('SELECT * FROM `lists` WHERE id=\'123\'');
        done();
    });

    it('should do a join', (done) => {

        List.join('items', {
            list_id: 'id'
        }).sql().should.equal('SELECT * FROM `lists` INNER JOIN `items` ON (`items`.`list_id`=`lists`.`id`)');
        List.join('items').sql().should.equal('SELECT * FROM `lists` INNER JOIN `items`');
        done();
    });

    it('should do a where', (done) => {

        List.where({
            tv_show: 'Breaking Bad'
        }).sql().should.equal('SELECT * FROM `lists` WHERE tv_show=\'Breaking Bad\'');
        done();
    });

    it('should order', (done) => {

        List.order('name desc').sql().should.equal('SELECT * FROM `lists` ORDER BY `name desc`');
        done();
    });

    it('should group', (done) => {

        List.group('name').sql().should.equal('SELECT * FROM `lists` GROUP BY `name`');
        done();
    });

    it('should limit', (done) => {

        List.limit(5).sql().should.equal('SELECT * FROM `lists` LIMIT 5');
        done();
    });

    it('should limit with offset', (done) => {

        List.limit(5, 10).sql().should.equal('SELECT * FROM `lists` LIMIT 5 OFFSET 10');
        done();
    });

    it('should select specific fields', (done) => {

        List.select('name', 'flower').sql().should.equal('SELECT name,flower FROM `lists`');
        done();
    });

    it('be chainable', (done) => {

        List.where({
            title: 'mountain dew'
        }).where({
            id: 123
        }).sql().should.equal('SELECT * FROM `lists` WHERE title=\'mountain dew\' AND id=\'123\'');
        done();
    });

    it('be stateless chainable', (done) => {

        List.where({
            id: 123
        });
        List.where({
            title: 'mountain dew'
        }).sql().should.equal('SELECT * FROM `lists` WHERE title=\'mountain dew\'');
        done();
    });

    it('should insert data for instance', (done) => {

        const Character =  DataStorm.model('character', DB);
        Character.insert_sql({
            first_name: 'walter',
            last_name: 'bishop',
            age: 64
        }).should.equal('INSERT INTO `characters` (`first_name`,`last_name`,`age`) VALUES (\'walter\', \'bishop\', 64)');
        done();
    });

    it('should update data for instance', (done) => {

        const Character =  DataStorm.model('character', DB);
        Character.where({
            id: 3
        }).update_sql({
            first_name: 'walter',
            last_name: 'bishop',
            age: 64
        }).should.equal('UPDATE `characters` SET `first_name` = \'walter\', `last_name` = \'bishop\', `age` = 64 WHERE id=\'3\'');
        done();
    });

    it('should do a fulltext query', (done) => {

        Item.where({
            name: 'keanu'
        }).full_text_search(['name', 'title'], 'matrix').sql().should.equal('SELECT * FROM `items` WHERE name=\'keanu\' AND (MATCH (`name`,`title`) AGAINST (\'matrix\'))');
        done();
    });

    it('should paginate', (done) => {

        Item.where({
            name: 'coton de tulear'
        }).paginate(1, 10).sql().should.equal('SELECT * FROM `items` WHERE name=\'coton de tulear\' LIMIT 10 OFFSET 0');
        Item.where({
            name: 'coton de tulear'
        }).paginate(2, 10).sql().should.equal('SELECT * FROM `items` WHERE name=\'coton de tulear\' LIMIT 10 OFFSET 10');
        done();
    });

    it('should delete data for instance', (done) => {

        const Character =  DataStorm.model('character', DB);
        Character.where({
            id: 3
        }).delete_sql().should.equal('DELETE  FROM `characters` WHERE id=\'3\'');
        done();
    });

    it('should return true if model instance is new', (done) => {

        const Character =  DataStorm.model('character', DB);
        const character = new Character({
            title: 'foo'
        });
        character.new.should.equal(true);
        done();
    });

    it('should validate fields', (done) => {

        const list = new List({
            age: 23,
            last_name: 'morgan',
            first_name: 'dexter'
        });
        list.validate((err) => {

            toString.call(err).should.equal('[object Null]');
            return done();
        });
    });

    it('should fail validate fields with bad value', (done) => {

        const list = new List({
            age: 'twenty three',
            last_name: 'morgan',
            first_name: 'dexter'
        });

        list.validate((err) => {

            if (toString.call(err) === '[object Null]') {
                'This should not be null.'.should.equal('');
            }
            err.should.equal('Validations failed. Check obj.errors to see the errors.');
            done();
        });
    });

    it('should not save on failed validate', (done) => {

        const list = new List({
            age: 'twenty three',
            last_name: 'morgan',
            first_name: 'debra'
        });
        list.save((err, id) => {

            err.should.exist;
            list.errors.should.have.property.age;
            list.errors.should.have.property.debra;
            done();
        });
    });

    it('should work with multiple associations', (done) => {

        const mock_db = new DataStorm.mock();

        const Song = DataStorm.model('song', mock_db);
        Song.many_to_one('album');
        Song.many_to_one('artist');
        const Album = DataStorm.model('album', mock_db);
        const Artist = DataStorm.model('Artist', mock_db);

        DataStorm.models.Song = Song;
        DataStorm.models.Album = Album;
        DataStorm.models.Artist = Artist;
        const song = new Song({
            name: 'hey ya',
            artist_id: 1,
            album_id: 2,
            id: 3
        });
        try {
            return song.album();
        }
        catch (_error) {
            mock_db.queries[0].should.equal('SELECT * FROM `albums` WHERE albums.id=\'2\' LIMIT 1');
            done();
        }
    });

    it('should work with polymorphic associations for one_to_many', (done) => {

        const mock_db = new DataStorm.mock();

        const Song = DataStorm.model('song', mock_db);
        Song.many_to_one('creator', {
            polymorphic: true
        });

        const Artist = DataStorm.model('Artist', mock_db);
        DataStorm.models.Artist = Artist;
        DataStorm.models.Song = Song;

        const song = new Song({
            creator_id: 23,
            creator_type: 'Artist',
            id: 14
        });
        try {
            return song.creator();
        }
        catch (_error) {
            mock_db.queries[0].should.equal('SELECT * FROM `artists` WHERE artists.id=\'23\' LIMIT 1');
            return done();
        }
    });

    it('should allow custom functions on the model', (done) => {

        const mock_db = new DataStorm.mock();
        const Song = DataStorm.model('song', mock_db);

        Song.byTitle = function (name) {

            return this.dataset().where({ song_title:  name });
        };

        const sql = Song.byTitle('muppet').sql();
        expect(sql).to.equal('SELECT * FROM `songs` WHERE song_title=\'muppet\'');
        done();
    });

    it('should allow custom functions on the instance', (done) => {

        const mock_db = new DataStorm.mock();
        const Song = DataStorm.model('song', mock_db);

        Song.prototype.byTitle = function (name) {

            return this.dataset().where({ song_title:  name,  creator_type: this.creator_type });
        };

        const song = new Song({
            creator_type: 'Artist'
        });

        const sql = song.byTitle('muppet').sql();
        expect(sql).to.equal('SELECT * FROM `songs` WHERE song_title=\'muppet\' AND creator_type=\'Artist\'');
        done();
    });

    it('should allow custom functions on the instance', (done) => {

        const mock_db = new DataStorm.mock();
        const Song = DataStorm.model('song', mock_db);

        Song.prototype.byTitle = function (name) {

            return this.dataset().where({ song_title:  name,  creator_type: this.creator_type });
        };

        DataStorm.models.Song = Song;
        const song = new Song({
            creator_type: 'Artist'
        });

        const sql = song.byTitle('muppet').sql();
        expect(sql).to.equal('SELECT * FROM `songs` WHERE song_title=\'muppet\' AND creator_type=\'Artist\'');
        done();
    });

    it('should update model with key', (done) => {

        const mock_db = new DataStorm.mock();
        const Song = DataStorm.model('song', mock_db);

        DataStorm.models.Song = Song;
        const song = new Song({
            creator_id: 23,
            creator_type: 'Artist',
            id: 14
        });
        song.new = false;
        song.values.creator_id = 24;
        song.save((err, num) => {

            expect(err).to.not.exist();
            mock_db.queries[0].should.equal('UPDATE `songs` SET `creator_id` = 23 WHERE id=\'14\'');
            return done();
        });
    });

    it('should work with polymorphic associations for many_to_one', (done) => {

        const mock_db = new DataStorm.mock();
        const Song = DataStorm.model('song', mock_db);
        const Artist = DataStorm.model('Artist', mock_db);
        Artist.one_to_many('songs', {
            as: 'creator'
        });

        DataStorm.models.Artist = Artist;
        DataStorm.models.Song = Song;
        const artist = new Artist({
            id: 99
        });
        artist.songs().sql().should.equal('SELECT * FROM `songs` WHERE (`songs`.`creator_id` = 99) AND (`songs`.`creator_type` = \'Artist\')');
        return done();
    });
});
