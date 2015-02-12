var __slice = [].slice;

var Async = require('Async');
var Inflection = require('inflection');

var internals = {};


internals.Errors = function() {}


internals.Errors.prototype.add = function(name, msg) {

    this[name] || (this[name] = []);
    return this[name].push(msg);
};


internals.Errors.prototype.__defineGetter__('length', function() {

    var errors = [];
    for (var error in this) {
        if (!this.hasOwnProperty(error)) {
            continue;
        }
        errors.push(error);
    }
    return errors.length;
});


internals.Model = function (values) {

    var name, value;
    this.values = values;
    this["new"] = true;
    this.set_associations();
    this.errors = {};
    for (name in values) {
        value = values[name];
        this[name] = value;
    }
}


internals.Model.create = function(values, cb) {

    var model;
    model = new this(values);
    return model.save(function(err, id) {

        model.id = id;
        return cb(err, model);
    });
};


internals.Model.validate = function(field_name, cb) {

    var _base;
    this.validations || (this.validations = {});
    (_base = this.validations)[field_name] || (_base[field_name] = []);
    return this.validations[field_name].push(cb);
};


internals.Model.prototype.validate = function(cb) {

    var defer, field, parallelize;
    var self = this;
    this.errors = new internals.Errors;
    parallelize = [];
    for (field in this.constructor.validations) {
        if (this["new"] || this.has_column_changed(field)) {
            defer = function(field) {

                return parallelize.push(function(done) {

                    return self.validate_field(field, done);
                });
            };
            defer(field);
        }
    }
    return Async.parallel(parallelize, function(err, results) {

        if (self.errors.length === 0) {
            return cb(null);
        }
        return cb('Validations failed. Check obj.errors to see the errors.');
    });
};


internals.Model.prototype.validate_field = function(field_name, cb) {

    var parallelize, validation_function, _i, _len, _ref;
    var self = this;
    if (!this.constructor.validations[field_name]) {
        return;
    }
    parallelize = [];
    _ref = this.constructor.validations[field_name];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        validation_function = _ref[_i];
        if (!validation_function) {
            this.errors.add(field_name, 'No validation function was specified');
        }
        parallelize.push(function(done) {

            return validation_function.bind(self)(field_name, self[field_name], done);
        });
    }
    return Async.parallel(parallelize, cb);
};


internals.Model.prototype.row_func = function(result) {

    return new this.constructor(result);
};


internals.Model.prototype.set_one_to_many_association = function() {

    var ref = this.constructor.associations.one_to_many;
    var results = [];
    for (var i = 0, il = ref.length; i < il; ++i) {
        var association = ref[i];
        results.push(this[association.function_name] = this.build_one_to_many_function(association));
    }
    return results;
};


internals.Model.prototype.build_one_to_many_function = function(association) {

    return function() {

        var dataset, key_link, model, where_str;
        model = internals.DataStorm.models[association.name];
        key_link = association.key || Inflection.singularize(this.constructor.model_name()).toLowerCase() + "_id";
        dataset = model.dataset();
        if (association.as) {
            where_str = "(`" + (model.table_name()) + "`.`" + association.as + "_id` = " + this.id + ")";
            dataset = dataset.where(where_str);
            where_str = "(`" + (model.table_name()) + "`.`" + association.as + "_type` = '" + this.constructor.model_name() + "')";
            dataset = dataset.where(where_str);
        } else {
            where_str = "(`" + (model.table_name()) + "`.`" + key_link + "` = " + this.id + ")";
            dataset = dataset.where(where_str);
        }
        return dataset;
    };
};


internals.Model.prototype.set_many_to_one_association = function() {

    var association, _i, _len, _ref, _results;
    _ref = this.constructor.associations.many_to_one;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        association = _ref[_i];
        _results.push(this[association.function_name] = this.build_many_to_one_function(association));
    }
    return _results;
};


internals.Model.prototype.build_many_to_one_function = function(association) {

    return function(cb) {

        var dataset, field, field_id, model, model_name, where;
        if (association.polymorphic === true) {
            field = association.name.toLowerCase() + "_type";
            model_name = this[field];
            model = internals.DataStorm.models[model_name];
        } else {
            model = internals.DataStorm.models[association.name];
        }
        field_id = association.name.toLowerCase() + "_id";
        where = {};
        where[model.table_name() + '.id'] = this[field_id];
        dataset = model.dataset().where(where);
        return dataset.first(cb);
    };
};


internals.Model.prototype.set_many_to_many_association = function() {

    var association, _i, _len, _ref, _results;
    _ref = this.constructor.associations.many_to_many;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        association = _ref[_i];
        _results.push(this[association.function_name] = this.build_many_to_many_function(association));
    }
    return _results;
};


internals.Model.prototype.build_many_to_many_function = function(association) {

    return function() {

        var dataset, join, join_table, model, where;
        model = internals.DataStorm.models[association.name];
        join = {};
        join[Inflection.singularize(association.function_name) + '_id'] = 'id';
        where = {};
        where[Inflection.singularize(this.constructor.table_name()) + '_id'] = this.id;
        join_table = [this.constructor.table_name(), model.table_name()].sort().join('_');
        dataset = model.dataset().select(model.table_name() + '.*').join(join_table, join).where(where);
        return dataset;
    };
};


internals.Model.prototype.set_associations = function() {

    if (!this.constructor.associations) {
        return;
    }
    if (this.constructor.associations.one_to_many) {
        this.set_one_to_many_association();
    }
    if (this.constructor.associations.many_to_one) {
        this.set_many_to_one_association();
    }
    if (this.constructor.associations.many_to_many) {
        return this.set_many_to_many_association();
    }
};


internals.Model._dataset = function() {

    this.opts || (this.opts = {});
    if (this.opts['dataset']) {
        return this.opts['dataset'];
    } else {
        return this.dataset();
    }
};


internals.Model.join = function(join_table, conditions) {

    var dataset;
    dataset = this._dataset().join(join_table, conditions);
    return this.clone({
        dataset: dataset
    });
};


internals.Model.select = function() {

    var dataset, fields;
    fields = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    dataset = this._dataset().select(fields);
    return this.clone({
        dataset: dataset
    });
};


internals.Model.where = function(conditions) {

    var dataset;
    dataset = this._dataset().where(conditions);
    return this.clone({
        dataset: dataset
    });
};


internals.Model.paginate = function(page, record_count) {

    var dataset;
    dataset = this._dataset().paginate(page, record_count);
    return this.clone({
        dataset: dataset
    });
};


internals.Model.order = function(order) {

    var dataset;
    dataset = this._dataset().order(order);
    return this.clone({
        dataset: dataset
    });
};


internals.Model.full_text_search = function(fields, query) {

    var dataset;
    dataset = this._dataset().full_text_search(fields, query);
    return this.clone({
        dataset: dataset
    });
};


internals.Model.group = function(group) {

    var dataset;
    dataset = this._dataset().group(group);
    return this.clone({
        dataset: dataset
    });
};


internals.Model.limit = function(limit, offset) {

    var dataset;
    if (offset == null) {
        offset = null;
    }
    dataset = this._dataset().limit(limit, offset);
    return this.clone({
        dataset: dataset
    });
};


internals.Model.prototype.modified = function() {

    return this["new"] || !(this.changed_columns().length === 0);
};


internals.Model.prototype.has_column_changed = function(field) {

    var column, _i, _len, _ref;
    _ref = this.changed_columns();
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        column = _ref[_i];
        if (column === field) {
            return true;
        }
    }
    return false;
};


internals.Model.prototype.changed_columns = function() {

    var changed, k, v, _ref;
    if (this["new"]) {
        return this.values;
    }
    changed = [];
    _ref = this.values;
    for (k in _ref) {
        v = _ref[k];
        if (this[k] !== v) {
            changed.push(k);
        }
    }
    return changed;
};


internals.Model.prototype["delete"] = function(cb) {

    var self = this;
    return this.constructor.where({
        id: this.id
    })["delete"](function(err, affectedRows, fields) {

        return cb(err, self);
    });
};


internals.Model.prototype.destroy = function(cb) {

    console.log("Warning: hooks are not implemented yet.");
    return this["delete"](cb);
};


internals.Model.prototype.after_create = function() {

    return this["new"] = false;
};


internals.Model.prototype.dataset = function() {

    return this.constructor.dataset();
};


internals.Model.prototype.save = function (cb) {

    var command = null;
    var self = this;
    if (!this.modified()) {
        return cb(false);
    }

    var validate = function (callbk) {

        return self.validate(callbk);
    };

    if (self['new']) {
        command = function (callbk) {

            self.constructor.insert(self.values, function (err, insertId, fields) {

                self.after_create();
                return callbk(err, insertId, fields);
            });
        };
    } else {
        command = function (callbk) {

            var change, updates, _i, _len, _ref;
            updates = {};
            _ref = self.changed_columns();
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                change = _ref[_i];
                updates[change] = self.values[change] = self[change];
            }
            return self.constructor.where({
                id: self.id
            }).update(updates, callbk);
        };
    }
    Async.series({
        validate: validate,
        command: command
    }, function (err, results) {

        if (err) {
            return cb(err);
        }
        return cb(err, results.command[0]);
    });

    return self;
};


internals.Model.sql = function() {

    if (this.opts['dataset']) {
        return this.opts['dataset'].sql();
    } else {
        return this.dataset().sql();
    }
};


internals.Model.merge = function(obj1, obj2) {

    var i, obj3;
    obj3 = {};
    for (i in obj1) {
        obj3[i] = obj1[i];
    }
    for (i in obj2) {
        obj3[i] = obj2[i];
    }
    return obj3;
};


internals.Model.clone = function(additions) {

    var new_obj;
    new_obj = this.merge(this, {});
    new_obj.opts = this.merge(this.opts, additions);
    return new_obj;
};


internals.Model.prototype.table_name = function() {

    return this.constructor.table_name();
};


internals.Model.many_to_one = function(name, association) {

    if (association == null) {
        association = {};
    }
    association = this._extend_association(name, association);
    this.associations || (this.associations = {});
    if (this.associations.many_to_one) {
        return this.associations.many_to_one.push(association);
    } else {
        return this.associations.many_to_one = [association];
    }
};


internals.Model.one_to_many = function(name, association) {

    if (association == null) {
        association = {};
    }
    association = this._extend_association(name, association);
    this.associations || (this.associations = {});
    if (this.associations.one_to_many) {
        return this.associations.one_to_many.push(association);
    } else {
        return this.associations.one_to_many = [association];
    }
};


internals.Model.many_to_many = function(name, association) {

    if (association == null) {
        association = {};
    }
    association = this._extend_association(name, association);
    this.associations || (this.associations = {});
    if (this.associations.many_to_many) {
        return this.associations.many_to_many.push(association);
    } else {
        return this.associations.many_to_many = [association];
    }
};


internals.Model._extend_association = function(name, association) {

    association.name = Inflection.camelize(Inflection.singularize(name));
    association.function_name = name.toLowerCase();
    return association;
};


internals.Model.has_many = internals.Model.one_to_many;


internals.Model.belongs_to = internals.Model.many_to_one;


internals.Model.has_and_belongs_to_many = internals.Model.many_to_many;


internals.Model.table_name = function() {

    return Inflection.tableize(this.model_name());
};

internals.Model.model_name = function() {

    return Inflection.camelize(Inflection.singularize(this._name || this.name));
};

internals.Model.find_query = function(id) {

    return this._dataset().where({
        id: id
    });
};


internals.Model.find_sql = function(id) {

    return this.find_query(id).sql();
};


internals.Model.find = function(id, cb) {

    return this.find_query(id).first(cb);
};


internals.Model.insert_sql = function(data) {

    return this._dataset().insert_sql(data);
};


internals.Model.insert = function(data, cb) {

    return this._dataset().insert(data, cb);
};


internals.Model.update_sql = function(data) {

    return this._dataset().update_sql(data);
};


internals.Model.delete_sql = function(data) {

    return this._dataset().delete_sql(data);
};


internals.Model["delete"] = function(cb) {

    return this._dataset()["delete"](cb);
};


internals.Model.truncate = function(cb) {

    return this._dataset().truncate(cb);
};


internals.Model.execute = function(sql, cb) {

    return this._dataset().execute(sql, cb);
};


internals.Model.destroy = function(cb) {

    console.log("Warning: hooks are not implemented yet.");
    return this["delete"](cb);
};


internals.Model.update = function(data, cb) {

    return this._dataset().update(data, cb);
};


internals.Model.all = function(cb) {

    return this._dataset().all(cb);
};


internals.Model.count = function(cb) {

    return this._dataset().count(cb);
};


internals.Model.dataset = function() {

    var self = this;
    var dataset = this.db.ds(this.table_name());
    dataset.set_row_func(function(result) {

        var model_instance;
        model_instance = new self(result);
        model_instance["new"] = false;
        return model_instance;
    });
    return dataset;
};


internals.Model.first = function(cb) {

    return this._dataset().first(cb);
};


module.exports = function(DataStorm) {

    internals.DataStorm = DataStorm;
    return DataStorm.Model = internals.Model;
};
