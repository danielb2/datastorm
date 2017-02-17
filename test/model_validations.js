'use strict';

const DataStorm = require('../lib');
const Lab = require('lab');
const lab = exports.lab = Lab.script();

const describe = lab.describe;
const it = lab.it;
const beforeEach = lab.beforeEach;

require('./_helper');

describe('Model.Validations', () => {

    beforeEach((done) => {

        return done();
    });

    describe('validate presence', () => {

        const Thing = DataStorm.model('thing');
        Thing.validate('name', DataStorm.validation.presence);

        it('error if not present', (done) => {

            const thing = new Thing();
            return thing.validate(() => {

                JSON.stringify(thing.errors).should.equal('{"name":["is not present"]}');
                return done();
            });
        });

        it('no problem if present', (done) => {

            const thing = new Thing();
            thing.name = 'naruto';
            return thing.validate(() => {

                JSON.stringify(thing.errors).should.equal('{}');
                return done();
            });
        });
    });

    describe('validate blank', () => {

        const Thing = DataStorm.model('thing');
        Thing.validate('name', DataStorm.validation.blank);

        it('error if blank', (done) => {

            const thing = new Thing();
            return thing.validate(() => {

                JSON.stringify(thing.errors).should.equal('{"name":["is blank"]}');
                return done();
            });
        });

        return it('no problem if not blank', (done) => {

            const thing = new Thing();
            thing.name = 'naruto';
            return thing.validate(() => {

                JSON.stringify(thing.errors).should.equal('{}');
                return done();
            });
        });
    });

    return describe('validate email', () => {

        const Thing = DataStorm.model('thing');
        Thing.validate('email', DataStorm.validation.email);

        it('error if not present', (done) => {

            const thing = new Thing();

            return thing.validate(() => {

                JSON.stringify(thing.errors).should.equal('{"email":["is not an email"]}');
                return done();
            });
        });

        it('error if not valid', (done) => {

            const thing = new Thing();
            thing.email = 'blah@foo';

            thing.validate(() => {

                JSON.stringify(thing.errors).should.equal('{"email":["is not an email"]}');
                return done();
            });
        });

        return it('fine if valid', (done) => {

            const thing = new Thing();
            thing.email = 'blah@foo.com';

            return thing.validate(() => {

                JSON.stringify(thing.errors).should.equal('{}');
                done();
            });
        });
    });
});
