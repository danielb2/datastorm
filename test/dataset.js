'use strict';

const Code = require('code');
const DataStorm = require('../lib');
const Lab = require('lab');
const lab = exports.lab = Lab.script();

const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;

require('./_helper');

describe('Dataset', () => {

    const db = new DataStorm.mysql({
        username: 'root',
        password: '',
        host: 'localhost',
        database: 'datastorm_test'
    });

    const dataset = db.ds('items');

    it('should do a fulltext query', (done) => {

        dataset.where({
            name: 'keanu'
        }).full_text_search(['name', 'title'], 'matrix').sql().should.equal('SELECT * FROM `items` WHERE name=\'keanu\' AND (MATCH (`name`,`title`) AGAINST (\'matrix\'))');
        done();
    });

    it('should do plain query', (done) => {

        expect(dataset.sql()).to.equal('SELECT * FROM `items`');
        done();
    });

    it('should paginate', (done) => {

        let sql = dataset.where({
            name: 'coton de tulear'
        }).paginate(1, 10).sql();

        expect(sql).to.equal('SELECT * FROM `items` WHERE name=\'coton de tulear\' LIMIT 10 OFFSET 0');

        sql = dataset.where({
            name: 'coton de tulear'
        }).paginate(2, 10).sql();
        expect(sql).to.equal('SELECT * FROM `items` WHERE name=\'coton de tulear\' LIMIT 10 OFFSET 10');

        done();
    });

    it('should not paginate something with a limit', (done) => {

        const paginate = () => {

            return dataset.where({
                name: 'coton de tulear'
            }).limit(10).paginate(1, 10).sql().should.equal('SELECT * FROM `items` WHERE name=\'coton de tulear\' LIMIT 10 OFFSET 0');
        };
        paginate.should.Throw(Error);
        done();
    });

    it('should do raw sql', (done) => {

        dataset.limit(3).raw('SeLeCt id from `items`').order('id', 'asc').sql().should.equal('SeLeCt id from `items` ORDER BY `id` LIMIT 3');
        dataset.raw('SeLeCt id from `items`').raw('LIMIT 4').sql().should.equal('SeLeCt id from `items` LIMIT 4');
        done();
    });

    it('should limit', (done) => {

        dataset.limit(3).sql().should.equal('SELECT * FROM `items` LIMIT 3');
        done();
    });

    it('should limit with offset', (done) => {

        dataset.limit(3, 10).sql().should.equal('SELECT * FROM `items` LIMIT 3 OFFSET 10');
        done();
    });

    it('should offset', (done) => {

        dataset.limit(null, 10).sql().should.equal('SELECT * FROM `items` OFFSET 10');
        done();
    });

    it('should order', (done) => {

        dataset.order('id asc').sql().should.equal('SELECT * FROM `items` ORDER BY `id asc`');
        done();
    });

    it('should group', (done) => {

        dataset.group('name').sql().should.equal('SELECT * FROM `items` GROUP BY `name`');
        done();
    });

    it('should do simple filter', (done) => {

        dataset.where({
            title: 'mountain dew'
        }).sql().should.equal('SELECT * FROM `items` WHERE title=\'mountain dew\'');
        done();
    });

    it('should filter multiple items', (done) => {

        dataset.where({
            title: 'mountain dew',
            id: 123
        }).sql().should.equal('SELECT * FROM `items` WHERE title=\'mountain dew\' AND id=\'123\'');
        done();
    });

    it('be chainable', (done) => {

        dataset.where({
            title: 'mountain dew'
        }).where({
            id: 123
        }).sql().should.equal('SELECT * FROM `items` WHERE title=\'mountain dew\' AND id=\'123\'');
        done();
    });

    it('be stateless chainable', (done) => {

        dataset.where({
            id: 123
        });
        dataset.where({
            title: 'mountain dew'
        }).sql().should.equal('SELECT * FROM `items` WHERE title=\'mountain dew\'');
        done();
    });

    it('should use in for where array', (done) => {

        dataset.where({
            id: [1, 2, 3]
        }).sql().should.equal('SELECT * FROM `items` WHERE `id` IN (1, 2, 3)');
        done();
    });

    it('should use in for where string array', (done) => {

        dataset.where({
            name: ['one', 'two']
        }).sql().should.equal('SELECT * FROM `items` WHERE `name` IN (\'one\', \'two\')');
        done();
    });

    it('should be able to define our own WHERE', (done) => {

        dataset.where('created_at=\'whatever\'').sql().should.equal('SELECT * FROM `items` WHERE created_at=\'whatever\'');
        done();
    });

    it('should be able to define our own WHERE with chains', (done) => {

        dataset.where({
            title: 'mountain dew'
        }).where('created_at=\'whatever\'').sql().should.equal('SELECT * FROM `items` WHERE title=\'mountain dew\' AND created_at=\'whatever\'');
        done();
    });

    it('should join two tables with ON clause', (done) => {

        dataset.join('order_items', {
            item_id: 'id'
        }).where({
            order_id: 1234
        }).sql().should.equal('SELECT * FROM `items` INNER JOIN `order_items` ON (`order_items`.`item_id`=`items`.`id`) WHERE order_id=\'1234\'');
        done();
    });

    it('should straight join two tables', (done) => {

        dataset.join('order_items').sql().should.equal('SELECT * FROM `items` INNER JOIN `order_items`');
        done();
    });

    it.skip('should chain joins tables', (done) => {

        dataset = db.ds('lists');
        dataset.join('items').join('tags').sql().should.equal('SELECT * FROM `lists` INNER JOIN `items` INNER JOIN `tags`');
        done();
    });

    it('should delete', (done) => {

        dataset.delete_sql().should.equal('DELETE  FROM `items`');
        done();
    });

    it('should delete join', (done) => {

        dataset.join('flowers').delete_sql().should.equal('DELETE `items` FROM `items` INNER JOIN `flowers`');
        done();
    });

    it('should update join', (done) => {

        dataset.join('flowers').update_sql().should.equal('UPDATE `items` INNER JOIN `flowers` SET ');
        done();
    });

    it('should allow to modify select', (done) => {

        const ds = db.ds('posts');
        ds.select('stamp', 'name').sql().should.equal('SELECT stamp, name FROM `posts`');
        done();
    });

    it('should print to console using DEBUG variable', (done) => {

        const consoleLog = console.log;
        let output = '';
        console.log = function (str) {

            output = str;
        };
        process.env.DEBUG = true;
        const ds = db.ds('posts');
        ds.select('stamp', 'name').first((err, res) => {

            delete process.env.DEBUG;
            console.log = consoleLog;
            expect(err).to.exist();
            expect(output).to.equal('SELECT stamp, name FROM `posts` LIMIT 1');
            done();
        });
    });

    it('should insert data', (done) => {

        const ds = db.ds('posts');
        ds.insert_sql({
            first_name: 'walter',
            last_name: 'bishop',
            age: 64
        }).should.equal('INSERT INTO `posts` (`first_name`,`last_name`,`age`) VALUES (\'walter\', \'bishop\', 64)');
        done();
    });

    it('should update data', (done) => {

        const ds = db.ds('movies');
        ds.join('characters').where({
            name: 'walter'
        }).update_sql({
            name: 'peter'
        }).should.equal('UPDATE `movies` INNER JOIN `characters` SET `name` = \'peter\' WHERE name=\'walter\'');
        done();
    });

    it.skip('should create table', (done) => {

        db.create_table('items', (handle) => {

            handle.add('primary_key', 'id');
            handle.add('name', 'String');
        });
        done();
    });

    it.skip('should iterate over recrods', (done) => {

        dataset.each((record) => {

            return console.log(record);
        });
        done();
    });
});
