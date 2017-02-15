'use strict';

const Async = require('Async');
const Inflection = require('inflection');

const internals = {};


internals.Errors = function () {};


internals.Errors.prototype.add = function (name, msg) {

    this[name] || (this[name] = []);
    return this[name].push(msg);
};


internals.Errors.prototype.__defineGetter__('length', function () {

    const errors = [];
    for (const error in this) {
        if (!this.hasOwnProperty(error)) {
            continue;
        }
        errors.push(error);
    }
    return errors.length;
});


internals.Model = function (values) {

    this.values = values;
    this.new = true;
    this.set_associations();
    this.errors = {};
    for (const name in values) {
        const value = values[name];
        this[name] = value;
    }
};


internals.Model.create = function (values, cb) {

    const model = new this(values);
    return model.save((err, id) => {

        model.id = id;
        return cb(err, model);
    });
};


internals.Model.validate = function (field_name, cb) {

    this.validations || (this.validations = {});
    let base;
    (base = this.validations)[field_name] || (base[field_name] = []);
    return this.validations[field_name].push(cb);
};


internals.Model.prototype.validate = function (cb) {

    const self = this;
    this.errors = new internals.Errors();
    const parallelize = [];
    for (const field in this.constructor.validations) {
        if (this.new || this.has_column_changed(field)) {
            parallelize.push((done) => {

                return self.validate_field(field, done);
            });
        }
    }

    Async.parallel(parallelize, (err, results) => {

        if (!err && self.errors.length === 0) {
            return cb(null);
        }
        return cb('Validations failed. Check obj.errors to see the errors.');
    });
};


internals.Model.prototype.validate_field = function (field_name, cb) {

    const self = this;
    if (!this.constructor.validations[field_name]) {
        return;
    }
    const parallelize = [];
    const ref = this.constructor.validations[field_name];
    for (let i = 0; i < ref.length; ++i) {
        const validation_function = ref[i];
        if (!validation_function) {
            this.errors.add(field_name, 'No validation function was specified');
        }
        parallelize.push((done) => {

            return validation_function.bind(self)(field_name, self[field_name], done);
        });
    }
    return Async.parallel(parallelize, cb);
};


internals.Model.prototype.row_func = function (result) {

    return new this.constructor(result);
};


internals.Model.prototype.set_one_to_many_association = function () {

    const ref = this.constructor.associations.one_to_many;
    const results = [];
    for (let i = 0; i < ref.length; ++i) {
        const association = ref[i];
        results.push(this[association.function_name] = this.build_one_to_many_function(association));
    }
    return results;
};


internals.Model.prototype.build_one_to_many_function = function (association) {

    return function () {

        const model = internals.DataStorm.models[association.name];
        const key_link = association.key || Inflection.singularize(this.constructor.model_name()).toLowerCase() + '_id';
        let dataset = model.dataset();
        if (association.as) {
            let where_str = '(`' + (model.table_name()) + '`.`' + association.as + '_id` = ' + this.id + ')';
            dataset = dataset.where(where_str);
            where_str = '(`' + (model.table_name()) + '`.`' + association.as + '_type` = \'' + this.constructor.model_name() + '\')';
            return dataset.where(where_str);
        }
        const where_str = '(`' + (model.table_name()) + '`.`' + key_link + '` = ' + this.id + ')';
        return dataset.where(where_str);
    };
};


internals.Model.prototype.set_many_to_one_association = function () {

    const ref = this.constructor.associations.many_to_one;
    const results = [];
    for (let i = 0; i < ref.length; ++i) {
        const association = ref[i];
        results.push(this[association.function_name] = this.build_many_to_one_function(association));
    }
    return results;
};


internals.Model.prototype.build_many_to_one_function = function (association) {

    return function (cb) {

        let model;
        if (association.polymorphic === true) {
            const field = association.name.toLowerCase() + '_type';
            const model_name = this[field];
            model = internals.DataStorm.models[model_name];
        }
        else {
            model = internals.DataStorm.models[association.name];
        }
        const field_id = association.name.toLowerCase() + '_id';
        const where = {};
        where[model.table_name() + '.id'] = this[field_id];
        const dataset = model.dataset().where(where);
        return dataset.first(cb);
    };
};


internals.Model.prototype.set_many_to_many_association = function () {

    const ref = this.constructor.associations.many_to_many;
    const results = [];
    for (let i = 0; i < ref.length; ++i) {
        const association = ref[i];
        results.push(this[association.function_name] = this.build_many_to_many_function(association));
    }
    return results;
};


internals.Model.prototype.build_many_to_many_function = function (association) {

    return function () {

        const model = internals.DataStorm.models[association.name];
        const join = {};
        join[Inflection.singularize(association.function_name) + '_id'] = 'id';
        const where = {};
        where[Inflection.singularize(this.constructor.table_name()) + '_id'] = this.id;
        const join_table = [this.constructor.table_name(), model.table_name()].sort().join('_');
        const dataset = model.dataset().select(model.table_name() + '.*').join(join_table, join).where(where);
        return dataset;
    };
};


internals.Model.prototype.set_associations = function () {

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


internals.Model._dataset = function () {

    this.opts || (this.opts = {});
    if (this.opts.dataset) {
        return this.opts.dataset;
    }
    return this.dataset();
};


internals.Model.join = function (join_table, conditions) {

    const dataset = this._dataset().join(join_table, conditions);
    return this.clone({
        dataset
    });
};


internals.Model.select = function () {

    const fields = arguments.length >= 1 ? [].slice.call(arguments, 0) : [];
    const dataset = this._dataset().select(fields);
    return this.clone({
        dataset
    });
};


internals.Model.where = function (conditions) {

    const dataset = this._dataset().where(conditions);
    return this.clone({
        dataset
    });
};


internals.Model.paginate = function (page, record_count) {

    const dataset = this._dataset().paginate(page, record_count);
    return this.clone({
        dataset
    });
};


internals.Model.order = function (order) {

    const dataset = this._dataset().order(order);
    return this.clone({
        dataset
    });
};


internals.Model.full_text_search = function (fields, query) {

    const dataset = this._dataset().full_text_search(fields, query);
    return this.clone({
        dataset
    });
};


internals.Model.group = function (group) {

    const dataset = this._dataset().group(group);
    return this.clone({
        dataset
    });
};


internals.Model.limit = function (limit, offset) {

    const dataset = this._dataset().limit(limit, offset);
    return this.clone({
        dataset
    });
};


internals.Model.prototype.modified = function () {

    return this.new || !(this.changed_columns().length === 0);
};


internals.Model.prototype.has_column_changed = function (field) {

    const ref = this.changed_columns();
    for (let i = 0; i < ref.length; ++i) {
        const column = ref[i];
        if (column === field) {
            return true;
        }
    }
    return false;
};


internals.Model.prototype.changed_columns = function () {

    if (this.new) {
        return this.values;
    }
    const changed = [];
    const ref = this.values;
    for (const k in ref) {
        const v = ref[k];
        if (this[k] !== v) {
            changed.push(k);
        }
    }
    return changed;
};


internals.Model.prototype.delete = function (cb) {

    const self = this;
    return this.constructor.where({
        id: this.id
    }).delete((err, affectedRows, fields) => {

        return cb(err, self);
    });
};


internals.Model.prototype.destroy = function (cb) {

    console.log('Warning: hooks are not implemented yet.');
    return this.delete(cb);
};


internals.Model.prototype.after_create = function () {

    this.new = false;
};


internals.Model.prototype.dataset = function () {

    return this.constructor.dataset();
};


internals.Model.prototype.save = function (cb) {

    let command = null;
    const self = this;
    if (!this.modified()) {
        return cb(false);
    }

    const validate = function (callbk) {

        return self.validate(callbk);
    };

    if (self.new) {
        command = function (callbk) {

            self.constructor.insert(self.values, (err, insertId, fields) => {

                self.after_create();
                return callbk(err, insertId, fields);
            });
        };
    }
    else {
        command = function (callbk) {

            const updates = {};
            const ref = self.changed_columns();
            for (let i = 0; i < ref.length; ++i) {
                const change = ref[i];
                updates[change] = self.values[change] = self[change];
            }
            return self.constructor.where({
                id: self.id
            }).update(updates, callbk);
        };
    }
    Async.series({
        validate,
        command
    }, (err, results) => {

        if (err) {
            return cb(err);
        }
        return cb(err, results.command[0]);
    });

    return self;
};


internals.Model.sql = function () {

    if (this.opts.dataset) {
        return this.opts.dataset.sql();
    }
    return this.dataset().sql();
};


internals.Model.merge = function (obj1, obj2) {

    const obj3 = {};
    for (const i in obj1) {
        obj3[i] = obj1[i];
    }
    for (const i in obj2) {
        obj3[i] = obj2[i];
    }
    return obj3;
};


internals.Model.clone = function (additions) {

    const new_obj = this.merge(this, {});
    new_obj.opts = this.merge(this.opts, additions);
    return new_obj;
};


internals.Model.prototype.table_name = function () {

    return this.constructor.table_name();
};


internals.Model.many_to_one = function (name, association) {

    association = association || {};
    association = this._extend_association(name, association);
    this.associations || (this.associations = {});
    if (this.associations.many_to_one) {
        return this.associations.many_to_one.push(association);
    }
    this.associations.many_to_one = [association];
};


internals.Model.one_to_many = function (name, association) {

    if (typeof (name) === 'function' && name.name === 'Model') {
        name = name.table_name();
    }

    association = association || {};
    association = this._extend_association(name, association);
    this.associations || (this.associations = {});
    if (this.associations.one_to_many) {
        return this.associations.one_to_many.push(association);
    }
    this.associations.one_to_many = [association];
};


internals.Model.many_to_many = function (name, association) {

    association = association || {};
    association = this._extend_association(name, association);
    this.associations || (this.associations = {});
    if (this.associations.many_to_many) {
        return this.associations.many_to_many.push(association);
    }
    this.associations.many_to_many = [association];
};


internals.Model._extend_association = function (name, association) {

    association.name = Inflection.camelize(Inflection.singularize(name));
    association.function_name = name.toLowerCase();
    return association;
};


internals.Model.has_many = internals.Model.one_to_many;


internals.Model.belongs_to = internals.Model.many_to_one;


internals.Model.has_and_belongs_to_many = internals.Model.many_to_many;


internals.Model.table_name = function () {

    return Inflection.tableize(this.model_name());
};

internals.Model.model_name = function () {

    return Inflection.camelize(Inflection.singularize(this._name || this.name));
};

internals.Model.find_query = function (id) {

    return this._dataset().where({
        id
    });
};


internals.Model.find_sql = function (id) {

    return this.find_query(id).sql();
};


internals.Model.find = function (id, cb) {

    return this.find_query(id).first(cb);
};


internals.Model.insert_sql = function (data) {

    return this._dataset().insert_sql(data);
};


internals.Model.insert = function (data, cb) {

    return this._dataset().insert(data, cb);
};


internals.Model.update_sql = function (data) {

    return this._dataset().update_sql(data);
};


internals.Model.delete_sql = function (data) {

    return this._dataset().delete_sql(data);
};


internals.Model.delete = function (cb) {

    return this._dataset().delete(cb);
};


internals.Model.truncate = function (cb) {

    return this._dataset().truncate(cb);
};


internals.Model.execute = function (sql, cb) {

    return this._dataset().execute(sql, cb);
};


internals.Model.destroy = function (cb) {

    console.log('Warning: hooks are not implemented yet.');
    return this.delete(cb);
};


internals.Model.update = function (data, cb) {

    return this._dataset().update(data, cb);
};


internals.Model.all = function (cb) {

    return this._dataset().all(cb);
};


internals.Model.count = function (cb) {

    return this._dataset().count(cb);
};


internals.Model.dataset = function () {

    const self = this;
    const dataset = this.db.ds(this.table_name());
    dataset.set_row_func((result) => {

        const model_instance = new self(result);
        model_instance.new = false;
        return model_instance;
    });
    return dataset;
};


internals.Model.first = function (cb) {

    return this._dataset().first(cb);
};


module.exports = function (DataStorm) {

    internals.DataStorm = DataStorm;
    DataStorm.Model = internals.Model;
    return DataStorm.Model;
};
