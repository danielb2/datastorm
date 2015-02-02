    __slice = [].slice;

  var Async = require('Async');
  var Lingo = require('Lingo');

  var internals = {};

  internals.Errors = function() {}

  internals.Errors.prototype.add = function(name, msg) {

      this[name] || (this[name] = []);
      return this[name].push(msg);
  };

  internals.Errors.prototype.__defineGetter__('length', function() {

      var error, errors;
      errors = [];
      for (error in this) {
          if (!this.hasOwnProperty(error)) {
              continue;
          }
          errors.push(error);
      }
      return errors.length;
  });




  module.exports = function(DataStorm) {

      return this.Model = (function() {

          function Model(values) {

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

          Model.create = function(values, cb) {

              var model;
              model = new this(values);
              return model.save(function(err, id) {

                  model.id = id;
                  return cb(err, model);
              });
          };

          Model.validate = function(field_name, cb) {

              var _base;
              this.validations || (this.validations = {});
              (_base = this.validations)[field_name] || (_base[field_name] = []);
              return this.validations[field_name].push(cb);
          };

          Model.prototype.validate = function(cb) {

              var defer, field, parallelize,
              _this = this;
              this.errors = new internals.Errors;
              parallelize = [];
              for (field in this.constructor.validations) {
                  if (this["new"] || this.has_column_changed(field)) {
                      defer = function(field) {

                          return parallelize.push(function(done) {

                              return _this.validate_field(field, done);
                          });
                      };
                      defer(field);
                  }
              }
              return Async.parallel(parallelize, function(err, results) {

                  if (_this.errors.length === 0) {
                      return cb(null);
                  }
                  return cb('Validations failed. Check obj.errors to see the errors.');
              });
          };

          Model.prototype.validate_field = function(field_name, cb) {

              var parallelize, validation_function, _i, _len, _ref,
              _this = this;
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

                      return validation_function.bind(_this)(field_name, _this[field_name], done);
                  });
              }
              return Async.parallel(parallelize, cb);
          };

          Model.prototype.row_func = function(result) {

              return new this.constructor(result);
          };

          Model.prototype.set_one_to_many_association = function() {

              var association, _i, _len, _ref, _results;
              _ref = this.constructor.associations.one_to_many;
              _results = [];
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                  association = _ref[_i];
                  _results.push(this[association.function_name] = this.build_one_to_many_function(association));
              }
              return _results;
          };

          Model.prototype.build_one_to_many_function = function(association) {

              return function() {

                  var dataset, key_link, model, where_str;
                  model = DataStorm.models[association.name];
                  key_link = association.key || Lingo.en.singularize(this.constructor.name).toLowerCase() + "_id";
                  dataset = model.dataset();
                  if (association.as) {
                      where_str = "(`" + (model.table_name()) + "`.`" + association.as + "_id` = " + this.id + ")";
                      dataset = dataset.where(where_str);
                      where_str = "(`" + (model.table_name()) + "`.`" + association.as + "_type` = '" + this.constructor.name + "')";
                      dataset = dataset.where(where_str);
                  } else {
                      where_str = "(`" + (model.table_name()) + "`.`" + key_link + "` = " + this.id + ")";
                      dataset = dataset.where(where_str);
                  }
                  return dataset;
              };
          };

          Model.prototype.set_many_to_one_association = function() {

              var association, _i, _len, _ref, _results;
              _ref = this.constructor.associations.many_to_one;
              _results = [];
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                  association = _ref[_i];
                  _results.push(this[association.function_name] = this.build_many_to_one_function(association));
              }
              return _results;
          };

          Model.prototype.build_many_to_one_function = function(association) {

              return function(cb) {

                  var dataset, field, field_id, model, model_name, where;
                  if (association.polymorphic === true) {
                      field = association.name.toLowerCase() + "_type";
                      model_name = this[field];
                      model = DataStorm.models[model_name];
                  } else {
                      model = DataStorm.models[association.name];
                  }
                  field_id = association.name.toLowerCase() + "_id";
                  where = {};
                  where[model.table_name() + '.id'] = this[field_id];
                  dataset = model.dataset().where(where);
                  return dataset.first(cb);
              };
          };

          Model.prototype.set_many_to_many_association = function() {

              var association, _i, _len, _ref, _results;
              _ref = this.constructor.associations.many_to_many;
              _results = [];
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                  association = _ref[_i];
                  _results.push(this[association.function_name] = this.build_many_to_many_function(association));
              }
              return _results;
          };

          Model.prototype.build_many_to_many_function = function(association) {

              return function() {

                  var dataset, join, join_table, model, where;
                  model = DataStorm.models[association.name];
                  join = {};
                  join[Lingo.en.singularize(association.function_name) + '_id'] = 'id';
                  where = {};
                  where[Lingo.en.singularize(this.constructor.table_name()) + '_id'] = this.id;
                  join_table = [this.constructor.table_name(), model.table_name()].sort().join('_');
                  dataset = model.dataset().select(model.table_name() + '.*').join(join_table, join).where(where);
                  return dataset;
              };
          };

          Model.prototype.set_associations = function() {

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

          Model._dataset = function() {

              this.opts || (this.opts = {});
              if (this.opts['dataset']) {
                  return this.opts['dataset'];
              } else {
                  return this.dataset();
              }
          };

          Model.join = function(join_table, conditions) {

              var dataset;
              dataset = this._dataset().join(join_table, conditions);
              return this.clone({
                  dataset: dataset
              });
          };

          Model.select = function() {

              var dataset, fields;
              fields = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
              dataset = this._dataset().select(fields);
              return this.clone({
                  dataset: dataset
              });
          };

          Model.where = function(conditions) {

              var dataset;
              dataset = this._dataset().where(conditions);
              return this.clone({
                  dataset: dataset
              });
          };

          Model.paginate = function(page, record_count) {

              var dataset;
              dataset = this._dataset().paginate(page, record_count);
              return this.clone({
                  dataset: dataset
              });
          };

          Model.order = function(order) {

              var dataset;
              dataset = this._dataset().order(order);
              return this.clone({
                  dataset: dataset
              });
          };

          Model.full_text_search = function(fields, query) {

              var dataset;
              dataset = this._dataset().full_text_search(fields, query);
              return this.clone({
                  dataset: dataset
              });
          };

          Model.group = function(group) {

              var dataset;
              dataset = this._dataset().group(group);
              return this.clone({
                  dataset: dataset
              });
          };

          Model.limit = function(limit, offset) {

              var dataset;
              if (offset == null) {
                  offset = null;
              }
              dataset = this._dataset().limit(limit, offset);
              return this.clone({
                  dataset: dataset
              });
          };

          Model.prototype.modified = function() {

              return this["new"] || !(this.changed_columns().length === 0);
          };

          Model.prototype.has_column_changed = function(field) {

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

          Model.prototype.changed_columns = function() {

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

          Model.prototype["delete"] = function(cb) {

              var _this = this;
              return this.constructor.where({
                  id: this.id
              })["delete"](function(err, affectedRows, fields) {

                  return cb(err, _this);
              });
          };

          Model.prototype.destroy = function(cb) {

              console.log("Warning: hooks are not implemented yet.");
              return this["delete"](cb);
          };

          Model.prototype.after_create = function() {

              return this["new"] = false;
          };

          Model.prototype.save = function(cb) {

              var command, validate,
              _this = this;
              if (!this.modified()) {
                  return cb(false);
              }
              validate = function(callbk) {

                  return _this.validate(callbk);
              };
              command = null;
              if (this["new"]) {
                  command = function(callbk) {

                      return _this.constructor.insert(_this.values, function(err, insertId, fields) {

                          _this.after_create();
                          return callbk(err, insertId, fields);
                      });
                  };
              } else {
                  command = function(callbk) {

                      var change, updates, _i, _len, _ref;
                      updates = {};
                      _ref = _this.changed_columns();
                      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                          change = _ref[_i];
                          updates[change] = _this.values[change] = _this[change];
                      }
                      return _this.constructor.where({
                          id: _this.id
                      }).update(updates, callbk);
                  };
              }
              Async.series({
                  validate: validate,
                  command: command
              }, function(err, results) {

                  if (err) {
                      return cb(err);
                  }
                  return cb(err, results.command[0]);
              });
              return this;
          };

          Model.sql = function() {

              if (this.opts['dataset']) {
                  return this.opts['dataset'].sql();
              } else {
                  return this.dataset().sql();
              }
          };

          Model.merge = function(obj1, obj2) {

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

          Model.clone = function(additions) {

              var new_obj;
              new_obj = this.merge(this, {});
              new_obj.opts = this.merge(this.opts, additions);
              return new_obj;
          };

          Model.prototype.table_name = function() {

              return this.constructor.table_name();
          };

          Model.many_to_one = function(name, association) {

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

          Model.one_to_many = function(name, association) {

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

          Model.many_to_many = function(name, association) {

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

          Model._extend_association = function(name, association) {

              association.name = Lingo.capitalize(Lingo.camelcase(Lingo.en.singularize(name).replace('_', ' ')));
              association.function_name = name.toLowerCase();
              return association;
          };

          Model.has_many = Model.one_to_many;

          Model.belongs_to = Model.many_to_one;

          Model.has_and_belongs_to_many = Model.many_to_many;

          Model.table_name = function() {

              return Lingo.underscore(Lingo.en.pluralize(this.name));
          };

          Model.find_query = function(id) {

              return this._dataset().where({
                  id: id
              });
          };

          Model.find_sql = function(id) {

              return this.find_query(id).sql();
          };

          Model.find = function(id, cb) {

              return this.find_query(id).first(cb);
          };

          Model.insert_sql = function(data) {

              return this._dataset().insert_sql(data);
          };

          Model.insert = function(data, cb) {

              return this._dataset().insert(data, cb);
          };

          Model.update_sql = function(data) {

              return this._dataset().update_sql(data);
          };

          Model.delete_sql = function(data) {

              return this._dataset().delete_sql(data);
          };

          Model["delete"] = function(cb) {

              return this._dataset()["delete"](cb);
          };

          Model.truncate = function(cb) {

              return this._dataset().truncate(cb);
          };

          Model.execute = function(sql, cb) {

              return this._dataset().execute(sql, cb);
          };

          Model.destroy = function(cb) {

              console.log("Warning: hooks are not implemented yet.");
              return this["delete"](cb);
          };

          Model.update = function(data, cb) {

              return this._dataset().update(data, cb);
          };

          Model.all = function(cb) {

              return this._dataset().all(cb);
          };

          Model.count = function(cb) {

              return this._dataset().count(cb);
          };

          Model.dataset = function() {

              var dataset,
              _this = this;
              dataset = this.db.ds(this.table_name());
              dataset.set_row_func(function(result) {

                  var model_instance;
                  model_instance = new _this(result);
                  model_instance["new"] = false;
                  return model_instance;
              });
              return dataset;
          };

          Model.first = function(cb) {

              return this._dataset().first(cb);
          };

          return Model;

      })();
  };
