var Code = require('code');
var DataStorm = require('../lib');
var Lab = require('lab');
var lab = exports.lab = Lab.script();

var describe = lab.describe;
var it = lab.it;
var before = lab.before;
var beforeEach = lab.beforeEach;
var after = lab.after;
var expect = Code.expect;

require("./_helper");

describe("Dataset", function() {

    var db = new DataStorm.mysql({
        username: 'root',
        password: '',
        host: 'localhost',
        database: 'datastorm_test'
    });

    var dataset = db.ds('items');

    it("should do a fulltext query", function (done) {

        dataset.where({
            name: 'keanu'
        }).full_text_search(['name', 'title'], 'matrix').sql().should.equal("SELECT * FROM `items` WHERE name='keanu' AND (MATCH (`name`,`title`) AGAINST ('matrix'))");
        done();
    });

    it("should do plain query", function (done) {
        expect(dataset.sql()).to.equal('SELECT * FROM `items`');
        done();
    });

    it("should paginate", function(done) {

        var sql = dataset.where({
            name: 'coton de tulear'
        }).paginate(1, 10).sql();

        expect(sql).to.equal("SELECT * FROM `items` WHERE name='coton de tulear' LIMIT 10 OFFSET 0");

        sql = dataset.where({
            name: 'coton de tulear'
        }).paginate(2, 10).sql();
        expect(sql).to.equal("SELECT * FROM `items` WHERE name='coton de tulear' LIMIT 10 OFFSET 10");

        done();
    });

    it("should not paginate something with a limit", function (done) {

        var paginate = function() {

            return dataset.where({
                name: 'coton de tulear'
            }).limit(10).paginate(1, 10).sql().should.equal("SELECT * FROM `items` WHERE name='coton de tulear' LIMIT 10 OFFSET 0");
        };
        paginate.should.Throw(Error);
        done();
    });

    it("should do raw sql", function (done) {

        dataset.limit(3).raw('SeLeCt id from `items`').order('id', 'asc').sql().should.equal("SeLeCt id from `items` ORDER BY `id` LIMIT 3");
        dataset.raw('SeLeCt id from `items`').raw('LIMIT 4').sql().should.equal("SeLeCt id from `items` LIMIT 4");
        done();
    });

    it("should limit", function (done) {

        dataset.limit(3).sql().should.equal("SELECT * FROM `items` LIMIT 3");
        done();
    });

    it("should limit with offset", function (done) {

        dataset.limit(3, 10).sql().should.equal("SELECT * FROM `items` LIMIT 3 OFFSET 10");
        done();
    });

    it("should offset", function (done) {

        dataset.limit(null, 10).sql().should.equal("SELECT * FROM `items` OFFSET 10");
        done();
    });

    it("should order", function (done) {

        dataset.order('id asc').sql().should.equal("SELECT * FROM `items` ORDER BY `id asc`");
        done();
    });

    it("should group", function (done) {

        dataset.group('name').sql().should.equal("SELECT * FROM `items` GROUP BY `name`");
        done();
    });

    it("should do simple filter", function (done) {

        dataset.where({
            title: 'mountain dew'
        }).sql().should.equal("SELECT * FROM `items` WHERE title='mountain dew'");
        done();
    });

    it("should filter multiple items", function (done) {

        dataset.where({
            title: 'mountain dew',
            id: 123
        }).sql().should.equal("SELECT * FROM `items` WHERE title='mountain dew' AND id='123'");
        done();
    });

    it("be chainable", function (done) {

        dataset.where({
            title: 'mountain dew'
        }).where({
            id: 123
        }).sql().should.equal("SELECT * FROM `items` WHERE title='mountain dew' AND id='123'");
        done();
    });

    it("be stateless chainable", function (done) {

        dataset.where({
            id: 123
        });
        dataset.where({
            title: 'mountain dew'
        }).sql().should.equal("SELECT * FROM `items` WHERE title='mountain dew'");
        done();
    });

    it("should use in for where array", function (done) {

        dataset.where({
            id: [1, 2, 3]
        }).sql().should.equal("SELECT * FROM `items` WHERE `id` IN (1, 2, 3)");
        done();
    });

    it("should use in for where string array", function (done) {

        dataset.where({
            name: ['one', 'two']
        }).sql().should.equal("SELECT * FROM `items` WHERE `name` IN ('one', 'two')");
        done();
    });

    it("should be able to define our own WHERE", function (done) {

        dataset.where("created_at='whatever'").sql().should.equal("SELECT * FROM `items` WHERE created_at='whatever'");
        done();
    });

    it("should be able to define our own WHERE with chains", function (done) {

        dataset.where({
            title: 'mountain dew'
        }).where("created_at='whatever'").sql().should.equal("SELECT * FROM `items` WHERE title='mountain dew' AND created_at='whatever'");
        done();
    });

    it("should join two tables with ON clause", function (done) {

        dataset.join('order_items', {
            item_id: 'id'
        }).where({
            order_id: 1234
        }).sql().should.equal("SELECT * FROM `items` INNER JOIN `order_items` ON (`order_items`.`item_id`=`items`.`id`) WHERE order_id='1234'");
        done();
    });

    it("should straight join two tables", function (done) {

        dataset.join('order_items').sql().should.equal("SELECT * FROM `items` INNER JOIN `order_items`");
        done();
    });

    it.skip("should chain joins tables", function (done) {

        dataset = db.ds('lists');
        dataset.join('items').join('tags').sql().should.equal("SELECT * FROM `lists` INNER JOIN `items` INNER JOIN `tags`");
        done();
    });

    it("should delete", function (done) {

        dataset.delete_sql().should.equal('DELETE * FROM `items`');
        done();
    });

    it("should delete join", function (done) {

        dataset.join('flowers').delete_sql().should.equal('DELETE `items` FROM `items` INNER JOIN `flowers`');
        done();
    });

    it("should update join", function (done) {

        dataset.join('flowers').update_sql().should.equal('UPDATE `items` INNER JOIN `flowers` SET ');
        done();
    });

    it("should allow to modify select", function (done) {

        dataset = db.ds('posts');
        dataset.select('stamp', 'name').sql().should.equal("SELECT stamp, name FROM `posts`");
        done();
    });

    it("should insert data", function (done) {

        dataset = db.ds('posts');
        dataset.insert_sql({
            first_name: 'walter',
            last_name: 'bishop',
            age: 64
        }).should.equal("INSERT INTO `posts` (`first_name`,`last_name`,`age`) VALUES ('walter', 'bishop', 64)");
        done();
    });

    it("should update data", function (done) {

        dataset = db.ds('movies');
        dataset.join('characters').where({
            name: 'walter'
        }).update_sql({
            name: 'peter'
        }).should.equal("UPDATE `movies` INNER JOIN `characters` SET `name` = 'peter' WHERE name='walter'");
        done();
    });

    it.skip("should create table", function(done) {

        db.create_table('items', function(handle) {
            handle.add('primary_key', 'id');
            handle.add('name', 'String');
        });
        done();
    });

    it.skip("should iterate over recrods", function (done) {

        dataset.each(function(record) {

            return console.log(record);
        });
        done();
    });
});
