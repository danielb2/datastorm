'use strict';

const Code = require('code');
const Lab = require('lab');
const lab = exports.lab = Lab.script();


const Promises = require('../lib/promises');

const internals = {};

const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;


internals.funcWithCallback = function (hasErr, callback) {

    if (!callback) {
        return Promises.wrap(this, internals.funcWithCallback, [hasErr]);
    }

    process.nextTick(() => {

        return Promises.return(callback, hasErr, 'whatevers');
    });
};

describe('promises', () => {

    it('should work like regular callback', (done) => {

        internals.funcWithCallback(null, (err, val) => {

            expect(err).to.equal(null);
            expect(val).to.equal('whatevers');
            done();
        });
    });

    it('should create a promise if no callback is passed', (done) => {

        internals.funcWithCallback(false).then((val) => {

            expect(val).to.equal('whatevers');
            done();
        });
    });


    it('it should return an error normally with promise', (done) => {

        internals.funcWithCallback('error').then((val) => {

            expect('shouldnt ever come here').to.equal('bad');
        }).catch((e) => {

            expect(e).to.equal(new Error('error'));
            done();
        });
    });

    it('shouldnt double wrap errors', (done) => {

        internals.funcWithCallback(new Error('error')).then((val) => {

            expect('shouldnt ever come here').to.equal('bad');
        }).catch((e) => {

            expect(e).to.equal(new Error('error'));
            done();
        });
    });

    it('handles no arguments and no callbacks', (done) => {

        const funcWithCallback = function (callback) {

            if (!callback) {
                return Promises.wrap(this, funcWithCallback);
            }

            process.nextTick(() => {

                return Promises.return(callback, null, 'whatevers');
            });
        };

        funcWithCallback().then((val) => {

            expect(val).to.equal('whatevers');
            done();
        }).catch((e) => {

            expect(e).to.equal('should never happen');
            done();
        });
    });



    it('it should return an error normally with callback', (done) => {

        internals.funcWithCallback('error', (err, val) => {

            expect(err).to.equal('error');
            done();
        });

    });
});

