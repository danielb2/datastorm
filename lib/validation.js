'use strict';

const internals = {};


internals.integer = function (name, value, done) {

    if (!(typeof value === 'number' || toString.call(value) === '[object Number]')) {
        this.errors.add(value, 'is not a number');
    }
    return done();
};


internals.unique = function (name, value, done) {

    return this.constructor.where({
        name: value
    }).first((err, result) => {

        if (err) {
            return done(err);
        }

        if (result) {
            this.errors.add(name, 'is already taken');
        }
        return done();
    });
};


internals.presence = function (name, value, done) {

    if (!value) {
        this.errors.add(name, 'is not present');
    }
    return done();
};


internals.blank = function (name, value, done) {

    if (!value || value.length === 0) {
        this.errors.add(name, 'is blank');
    }
    return done();
};


internals.email = function (name, value, done) {

    const email_regexp = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
    if (!email_regexp.test(value)) {
        this.errors.add(name, 'is not an email');
    }
    return done();
};


module.exports = {
    integer: internals.integer,
    unique: internals.unique,
    numeric: internals.integer,
    presence: internals.presence,
    email: internals.email,
    blank: internals.blank
};
