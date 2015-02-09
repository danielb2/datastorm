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

describe("Model.Validations", function() {

    var dataset, db;

    db = new DataStorm.mysql({
        username: 'root',
        password: '',
        host: 'localhost',
        database: 'datastorm_test'
    });

    dataset = db.ds('items');

    beforeEach(function(done) {
        return done();
    });

    describe("validate presence", function() {

        var Thing = DataStorm.model('thing');
        Thing.validate('name', DataStorm.validation.presence);

        it("error if not present", function(done) {
            var thing;
            thing = new Thing;
            return thing.validate(function() {
                JSON.stringify(thing.errors).should.equal('{"name":["is not present"]}');
                return done();
            });
        });

        it("no problem if present", function(done) {

            var thing;
            thing = new Thing;
            thing.name = "naruto";
            return thing.validate(function() {

                JSON.stringify(thing.errors).should.equal("{}");
                return done();
            });
        });
    });

    describe("validate blank", function() {

        var Thing = DataStorm.model('thing');
        Thing.validate('name', DataStorm.validation.blank);

        it("error if blank", function(done) {

            var thing = new Thing;
            return thing.validate(function() {

                JSON.stringify(thing.errors).should.equal('{"name":["is blank"]}');
                return done();
            });
        });

        return it("no problem if not blank", function(done) {

            var thing = new Thing;
            thing.name = "naruto";
            return thing.validate(function() {

                JSON.stringify(thing.errors).should.equal("{}");
                return done();
            });
        });
    });

    return describe("validate email", function() {

        var Thing = DataStorm.model('thing');
        Thing.validate('email', DataStorm.validation.email);

        it("error if not present", function(done) {

            var thing = new Thing;

            return thing.validate(function() {

                JSON.stringify(thing.errors).should.equal('{"email":["is not an email"]}');
                return done();
            });
        });

        it("error if not valid", function(done) {

            var thing = new Thing;
            thing.email = "blah@foo";

            thing.validate(function() {

                JSON.stringify(thing.errors).should.equal('{"email":["is not an email"]}');
                return done();
            });
        });

        return it("fine if valid", function(done) {

            var thing = new Thing;
            thing.email = "blah@foo.com";

            return thing.validate(function() {

                JSON.stringify(thing.errors).should.equal('{}');
                done();
            });
        });
    });
});
