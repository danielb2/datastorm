var __hasProp = {}.hasOwnProperty,
__extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

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

        var Thing = (function(_super) {

            __extends(Thing, _super);

            function Thing() {

                return Thing.__super__.constructor.apply(this, arguments);
            }

            Thing.validate('name', DataStorm.validation.presence);

            return Thing;

        })(DataStorm.Model);

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

        var Thing = (function(_super) {

            __extends(Thing, _super);

            function Thing() {

                return Thing.__super__.constructor.apply(this, arguments);
            }

            Thing.validate('name', DataStorm.validation.blank);

            return Thing;

        })(DataStorm.Model);

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

        var Thing;
        Thing = (function(_super) {
            __extends(Thing, _super);

            function Thing() {
                return Thing.__super__.constructor.apply(this, arguments);
            }

            Thing.validate('email', DataStorm.validation.email);

            return Thing;

        })(DataStorm.Model);

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
