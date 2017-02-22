'use strict';

const Code = require('code');
const DataStorm = require('../lib');
const Lab = require('lab');
const lab = exports.lab = Lab.script();

const describe = lab.describe;
const it = lab.it;
const beforeEach = lab.beforeEach;
const expect = Code.expect;

process.env.NODE_ENV = 'test';
// process.env.DEBUG = 'test';


const DB = new DataStorm.sqlite3('./test/datastorm_test.db');

describe('sqlite3', () => {

    beforeEach((done) => {

        const ds = DB.ds('users');
        ds.query('DROP TABLE IF EXISTS `users`', () =>  {

            ds.query('CREATE TABLE `users` ( `id` integer NOT NULL PRIMARY KEY AUTOINCREMENT, `email` varchar(255) UNIQUE, `first_name` varchar(255), `last_name` varchar(255), `age` integer);', () => {

                done();
            });
        });
    });

    describe('Dataset', () => {

        it('should get the first record', (done) => {

            const ds = DB.ds('users');
            ds.insert({ first_name: 'derp' }, (err, insertId) => {

                expect(err).to.not.exist();
                expect(insertId).to.equal(1);
                ds.first((errFirst, res) => {

                    expect(errFirst).to.not.exist();
                    expect(res.first_name).to.equal('derp');
                    done();
                });
            });
        });

        it('should update record', (done) => {

            const ds = DB.ds('users');

            const promises = [];

            promises.push(ds.insert({ first_name: 'Rustin', last_name: 'Cohle' }).then((insertId) => {

                return insertId;
            }));


            promises.push(ds.update({ first_name: 'Martin', last_name: 'Hart' }).then((rowsAffected) => {

                return rowsAffected;
            }));

            promises.push(ds.first().then((result) => {

                return result;
            }));

            return Promise.all(promises).then((values) => {

                expect(values).to.equal([
                    1,
                    1,
                    {
                        id: 1,
                        email: null,
                        first_name: 'Martin',
                        last_name: 'Hart',
                        age: null
                    }
                ]);
            });
        });
    });
});
