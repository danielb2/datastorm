'use strict';

const Code = require('code');
const DataStorm = require('../lib');
const Lab = require('lab');
const lab = exports.lab = Lab.script();

const describe = lab.describe;
const it = lab.it;
const beforeEach = lab.beforeEach;
const expect = Code.expect;


require('./_helper');

const DB = new DataStorm.mysql({
    username: 'root',
    password: '',
    host: 'localhost',
    database: 'datastorm_test'
});

const List = DataStorm.model('list');
List.db = DB;
List.one_to_many('items');
List.many_to_many('tags');


const Item = DataStorm.model('item', DB);
Item.many_to_one('list');

let Tag = DataStorm.model('tag', DB);
Tag.many_to_many('lists');

Tag.validate('name', function (name, val, done) {


    return this.constructor.where({
        name: val
    }).first((function (_this) {

        return function (err, result) {

            expect(err).to.not.exist();
            if (result) {
                _this.errors.add(name, 'must be unique');
            }
            _this.ran = true;
            return done();
        };

    })(this));
});


const Actor = DataStorm.model('actor', DB);
Actor.prototype.after_create = function () {

    Actor.__super__.after_create.apply(this, arguments);
    this.was_saved = true;
    return true;
};

DataStorm.models = {
    Tag,
    List,
    Item,
    Actor
};

describe('Mysql', () => {

    beforeEach((done) => {

        const _ref = require('child_process');
        const exec = _ref.exec;
        return exec('mysql -uroot datastorm_test < test/datastorm_test.sql', () => {

            return done();
        });
    });

    describe('Model', () => {

        it('should truncate table', (done) => {

            return Item.truncate((err) => {

                expect(err).to.not.exist();
                return Item.all((err, items) => {

                    expect(err).to.not.exist();
                    items.length.should.equal(0);
                    return done();
                });
            });
        });

        it('should execute arbitrary command', (done) => {

            return Item.execute('TRuncATE `items`', (err) => {

                expect(err).to.not.exist();
                return Item.all((err, items) => {

                    expect(err).to.not.exist();
                    items.length.should.equal(0);
                    return done();
                });
            });
        });

        it('should call the after create after a new record has been created', (done) => {

            const character = new Actor({
                first_name: 'dexter',
                last_name: 'morgan',
                age: 34
            });

            return character.save((err, result) => {

                expect(err).to.not.exist();
                character.was_saved.should.equal(true);
                return done();
            });
        });

        it('should be able to validate uniqueness using callbacks for validation', (done) => {

            const item = new Tag({
                name: 'wish'
            });

            return item.save((err, result) => {

                if (toString.call(err) === '[object Null]') {
                    'This should not be null.'.should.equal('');
                }
                err.should.equal('Validations failed. Check obj.errors to see the errors.');
                return done();
            });
        });

        it('should not run validations for fields which have not changed', (done) => {

            return Tag.first((err, tag) => {

                expect(err).to.not.exist();
                expect(tag.ran).to.equal(undefined);
                tag.id = 3;
                return tag.save((err, numChangedRows) => {

                    expect(err).to.not.exist();
                    expect(tag.ran).to.equal(undefined);
                    return done();
                });
            });
        });

        it('should only run validations for fields which have changed', (done) => {

            return Tag.first((err, tag) => {

                expect(err).to.not.exist();
                tag.name = 'something';
                expect(tag.ran).to.equal(undefined);
                return tag.save((err, numChangedRows) => {

                    expect(err).to.not.exist();
                    tag.ran.should.equal(true);
                    return done();
                });
            });
        });

        it('should the first record as a model', (done) => {

            return List.first((err, list) => {

                expect(err).to.not.exist();
                list.table_name().should.equal('lists');
                list.id.should.equal(51);
                list.name.should.equal('a list');
                return done();
            });
        });

        it('record retrieved should not be new', (done) => {

            return List.first((err, list) => {

                expect(err).to.not.exist();
                list.new.should.equal(false);
                return done();
            });
        });

        it('should fire the row_proc method for each record', (done) => {

            const ds = DB.ds('lists');
            ds.set_row_func((result) => {

                return new List(result);
            });
            return ds.first((err, row) => {

                expect(err).to.not.exist();
                row.table_name().should.equal('lists');
                return done();
            });
        });

        it('should link to first record through one_to_many relationship', (done) => {

            return List.first((err, list) => {

                expect(err).to.not.exist();
                return list.items().first((err, item) => {

                    expect(err).to.not.exist();
                    item.name.should.equal('an item');
                    item.constructor.model_name().should.equal('Item');
                    item.id.should.equal(42);
                    item.table_name().should.equal('items');
                    return done();
                });
            });
        });

        it('should link to records through one_to_many relationship', (done) => {

            return List.first((err, list) => {

                expect(err).to.not.exist();
                return list.items().all((err, items) => {

                    expect(err).to.not.exist();
                    const item = items[0];
                    item.name.should.equal('an item');
                    item.constructor.model_name().should.equal('Item');
                    item.id.should.equal(42);
                    item.table_name().should.equal('items');
                    return done();
                });
            });
        });

        it('should link to records through many_to_one relationship', (done) => {

            return Item.find(42, (err, item) => {

                expect(err).to.not.exist();
                item.name.should.equal('an item');
                item.constructor.model_name().should.equal('Item');
                return item.list((err, list) => {

                    expect(err).to.not.exist();
                    list.constructor.model_name().should.equal('List');
                    list.id.should.equal(51);
                    list.name.should.equal('a list');
                    return done();
                });
            });
        });

        it('should find all', (done) => {

            return Item.all((err, items) => {

                expect(err).to.not.exist();
                items[0].name.should.equal('another item');
                items[0].constructor.model_name().should.equal('Item');
                items[1].name.should.equal('an item');
                return done();
            });
        });

        it('should count as model', (done) => {

            return Item.count((err, count) => {

                expect(err).to.not.exist();
                count.should.equal(2);
                return done();
            });
        });

        it('should save a new item', (done) => {

            const item = new Item({
                id: 190,
                list_id: 12,
                name: 'the new item'
            });

            item.save((err, result) => {

                expect(err).to.equal(null);
                expect(result).to.equal(190);
                done();
            });
        });

        it('should behave well even if some values are bad', (done) => {

            const item = new Item({
                id: 190,
                flower: 'there\'s no flower'
            });
            return item.save((err, result) => {

                expect(err).to.not.equal(null);
                return done();
            });
        });

        it('should update a fetched item', (done) => {

            Item.find(42, (err, item) => {

                expect(err).to.not.exist();
                item.name = 'flower';
                item.save((err, result) => {

                    expect(err).to.not.exist();
                    expect(result).to.equal(1);
                    Item.find(42, (err, res) => {

                        expect(err).to.not.exist();
                        expect(res.name).to.equal('flower');
                        done();
                    });
                });
            });
        });

        it('should delete a fetched item', (done) => {

            return Item.find(42, (err, item) => {

                expect(err).to.not.exist();
                return item.delete((err, result) => {

                    expect(err).to.not.exist();
                    result.should.equal(item);
                    return Item.find(42, (err, res) => {

                        expect(err).to.not.exist();
                        return done();
                    });
                });
            });
        });

        it('should create an item', (done) => {

            Item.create({
                name: 'created item',
                list_id: 2
            }, (err, item) => {

                expect(err).to.not.exist();
                return Item.find(item.id, (err, result) => {

                    expect(err).to.not.exist();
                    result.name.should.equal('created item');
                    return done();
                });
            });
        });

        it('should destroy a fetched item', (done) => {

            return Item.find(42, (err, item) => {

                expect(err).to.not.exist();
                return item.destroy((err, result) => {

                    expect(err).to.not.exist();
                    result.should.equal(item);
                    return Item.find(42, (err, res) => {

                        expect(err).to.not.exist();
                        return done();
                    });
                });
            });
        });

        it('should link to records through many_to_many relationship', (done) => {

            return List.find(51, (err, list) => {

                expect(err).to.not.exist();
                return list.tags().all((err, tags) => {

                    expect(err).to.not.exist();
                    tags[0].name.should.equal('supplies');
                    tags[1].name.should.equal('fun');
                    return Tag.find(1, (err, tag) => {

                        expect(err).to.not.exist();
                        return tag.lists().all((err, lists) => {

                            expect(err).to.not.exist();
                            lists[0].name.should.equal('a list');
                            return done();
                        });
                    });
                });
            });
        });

        return it('should return true if model instance has changed', (done) => {

            return Item.find(42, (err, item) => {

                expect(err).to.not.exist();
                item.modified().should.equal(false);
                item.name = 'walther smith';
                item.modified().should.equal(true);
                return done();
            });
        });
    });

    describe('Dataset', () => {

        it('should the first record', (done) => {

            const ds = DB.ds('lists');
            return ds.first((err, row) => {

                expect(err).to.not.exist();
                row.id.should.equal(51);
                row.name.should.equal('a list');
                return done();
            });
        });

        it('should get all record', (done) => {

            const dataset = DB.ds('items');
            return dataset.all((err, items, fields) => {

                expect(err).to.not.exist();
                items[0].name.should.equal('another item');
                items[1].name.should.equal('an item');
                return done();
            });
        });

        it('should count as ds', (done) => {

            const dataset = DB.ds('items');
            return dataset.count((err, count) => {

                expect(err).to.not.exist();
                count.should.equal(2);
                return done();
            });
        });

        it('should insert data', (done) => {

            const dataset = DB.ds('items');

            dataset.insert({
                name: 'inserted item',
                list_id: 12
            }, (err, row_id) => {

                expect(err).to.equal(null);
                dataset.where({
                    name: 'inserted item'
                }).all((err, results) => {

                    expect(err).to.not.exist();
                    expect(results.length).to.equal(1);
                    expect(results[0].name).to.equal('inserted item');
                    row_id.should.equal(results[0].id);
                    done();
                });
            });
        });

        it('should update data', (done) => {

            const dataset = DB.ds('items');
            return dataset.update({
                name: 'jesse pinkman'
            }, (err, affected_rows) => {

                expect(err).to.not.exist();
                return dataset.where({
                    name: 'jesse pinkman'
                }).all((err, results) => {

                    expect(err).to.not.exist();
                    results[0].name.should.equal('jesse pinkman');
                    affected_rows.should.equal(results.length);
                    return done();
                });
            });
        });

        it('should behave well even if some values are bad', (done) => {

            const dataset = DB.ds('items');
            return dataset.insert({
                blah: 'inserted item'
            }, (err, row_id) => {

                err.should.exist;
                return done();
            });
        });

        it('should truncate table', (done) => {

            const dataset = DB.ds('items');
            return dataset.truncate((err) => {

                expect(err).to.not.exist();
                return dataset.all((err, items, fields) => {

                    expect(err).to.not.exist();
                    items.length.should.equal(0);
                    return done();
                });
            });
        });

        return it('should execute arbitrary command', (done) => {

            const dataset = DB.ds('items');
            return dataset.execute('TRuncATE `items`', (err) => {

                expect(err).to.not.exist();
                return dataset.all((err, items, fields) => {

                    expect(err).to.not.exist();
                    items.length.should.equal(0);
                    return done();
                });
            });
        });
    });

    return describe('Model Validation', () => {

        return it('should validate uniqueness', (done) => {

            Tag = DataStorm.model('tag', DB);
            Tag.validate('name', DataStorm.validation.unique);

            const tag = new Tag({
                name: 'wish'
            });

            return tag.validate((err, finished) => {

                expect(err).to.exist();
                expect(err).to.equal('Validations failed. Check obj.errors to see the errors.');
                JSON.stringify(tag.errors).should.equal('{"name":["is already taken"]}');
                return done();
            });
        });
    });
});
