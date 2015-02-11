var Escape = require('mysql').escape;
var __slice = [].slice;


var internals = {};

internals.dataset = function dataset(connection, tableName) {

    this.connection = connection;
    this.tableName = tableName;
    this.clause = {
        raw: []
    };
}


internals.dataset.prototype.merge = function(obj1, obj2) {

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


internals.dataset.prototype.clone = function(additions) {

    var new_obj;
    new_obj = this.merge(this, {});
    new_obj.clause = this.merge(this.clause, additions);
    return new_obj;
};


internals.dataset.prototype.set_row_func = function(func) {

    return this.row_func = func;
};


internals.dataset.prototype.row_func = function(row) {

    return row;
};


internals.dataset.prototype.where = function(conditions) {

    var new_where;
    if (toString.call(conditions) === '[object String]') {
        new_where = this.clause.where_strings ? (this.clause.where_strings.push(conditions), this.clause.where_strings) : [conditions];
        return this.clone({
            where_strings: new_where
        });
    } else {
        new_where = this.clause.where ? this.merge(this.clause.where, conditions) : conditions;
        return this.clone({
            where: new_where
        });
    }
};


internals.dataset.prototype.raw = function(sql) {

    return this.clone({
        raw: this.clause.raw.concat(sql)
    });
};



internals.dataset.prototype.limit = function(limit, offset) {

    var new_obj;
    if (offset == null) {
        offset = null;
    }
    new_obj = this.clone({
        limit: limit,
        offset: offset
    });
    return new_obj;
};


internals.dataset.prototype.full_text_search = function(fields, query) {

    return this.clone({
        full_text_search: {
            fields: fields,
            query: query
        }
    });
};


internals.dataset.prototype.order = function(order) {

    return this.clone({
        order: order
    });
};


internals.dataset.prototype.group = function(group) {

    return this.clone({
        group: group
    });
};


internals.dataset.prototype.paginate = function(page, record_count) {

    return this.clone({
        paginate: {
            page: page,
            record_count: record_count
        }
    });
};


internals.dataset.prototype.join = function(table_name, conditions) {

    return this.clone({
        join: {
            table_name: table_name,
            conditions: conditions
        }
    });
};


internals.dataset.prototype.query = function(sql, cb) {

    if (process.env.DEBUG) {
        console.log(sql);
    }
    return this.connection.query(sql, function(err, results, fields) {
        return cb(err, results, fields);
    });
};


internals.dataset.prototype.all = function(cb) {

    var _this = this;
    return this.query(this.sql(), function(err, result, fields) {

        var res;
        if (err) {
            return cb(err);
        }
        return cb(err, (function() {

            var _i, _len, _results;
            _results = [];
            for (_i = 0, _len = result.length; _i < _len; _i++) {
                res = result[_i];
                _results.push(this.row_func(res));
            }
            return _results;
        }).call(_this), fields);
    });
};


internals.dataset.prototype.first = function(cb) {

    var _this = this;
    return this.query(this.limit(1).sql(), function(err, result, fields) {

        var res;
        if (err) {
            return cb(err);
        }
        return cb(err, ((function() {

            var _i, _len, _results;
            _results = [];
            for (_i = 0, _len = result.length; _i < _len; _i++) {
                res = result[_i];
                _results.push(this.row_func(res));
            }
            return _results;
        }).call(_this))[0], fields);
    });
};


internals.dataset.prototype.count = function(cb) {

    var _this = this;
    return this.query(this.select('COUNT(*) as count').sql(), function(err, result, fields) {

        if (err) {
            return cb(err);
        }
        return cb(err, result[0].count, fields);
    });
};


internals.dataset.prototype.select = function() {

    var fields;
    fields = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    return this.clone({
        select: fields
    });
};


internals.dataset.prototype._build_full_text_search = function() {

    var params, query;
    if (!this.clause.full_text_search) {
        return null;
    }
    params = this._stringify_field_names(this.clause.full_text_search.fields);
    query = this._stringify_field_values([this.clause.full_text_search.query]);
    return "(MATCH (" + params + ") AGAINST (" + query + "))";
};


internals.dataset.prototype._build_join = function() {

    var join_query, k, key, v, value, _ref;
    join_query = "INNER JOIN `" + this.clause.join.table_name + "`";
    if (this.clause.join.conditions) {
        _ref = this.clause.join.conditions;
        for (k in _ref) {
            v = _ref[k];
            key = "`" + this.clause.join.table_name + "`.`" + k + "`";
            value = "`" + this.tableName + "`.`" + v + "`";
            return join_query + (" ON (" + key + "=" + value + ")");
        }
    } else {
        return join_query;
    }
};


internals.dataset.prototype.insert_sql = function(data) {

    var field_names = [];
    var field_values = [];
    var sql;

    for (var k in data) {
        var v = data[k];
        field_names.push(k);
        field_values.push(v);
    }
    var field_name_str = this._stringify_field_names(field_names);
    var field_value_str = this._stringify_field_values(field_values);
    return sql = "INSERT INTO `" + this.tableName + "` (" + field_name_str + ") VALUES (" + field_value_str + ")";
};


internals.dataset.prototype.insert = function(data, cb) {

    return this.query(this.insert_sql(data), function(err, result, fields) {

        if (err) {
            return cb(err);
        }
        return cb(err, result.insertId, fields);
    });
};


internals.dataset.prototype["delete"] = function(cb) {

    return this.query(this.delete_sql(), function(err, result, fields) {

        if (err) {
            return cb(err);
        }
        return cb(err, result.affectedRows, fields);
    });
};


internals.dataset.prototype.update = function(data, cb) {

    return this.query(this.update_sql(data), function(err, result, fields) {

        if (err) {
            return cb(err);
        }
        return cb(err, result.affectedRows, fields);
    });
};


internals.dataset.prototype.truncate = function(cb) {

    return this.query("TRUNCATE `" + this.tableName + "`", function(err, result) {
        if (err) {
            return cb(err);
        }
        return cb(err, result.affectedRows);
    });
};


internals.dataset.prototype.execute = function(sql, cb) {

    return this.query(sql, cb);
};

internals.dataset.prototype._stringify_field_names = function(array) {

    return JSON.stringify(array).replace(/"/g, '`', 'gi').replace(/[\[\]]/g, '');
};


internals.dataset.prototype._stringify_field_values = function(array) {

    if (this.connection.escape) {
        return this.connection.escape(array);
    }
    return escape(array);
};


internals.dataset.prototype._build_where = function() {

    var field_name_str, field_value_str, fts, k, v, whereClause, _i, _len, _ref, _ref1;
    whereClause = [];
    _ref = this.clause.where;
    for (k in _ref) {
        v = _ref[k];
        field_name_str = this._stringify_field_names([k]);
        field_value_str = this._stringify_field_values([v]);
        if (toString.call(v) === '[object Array]') {
            whereClause.push("" + field_name_str + " IN " + field_value_str);
        } else {
            whereClause.push("" + k + "='" + v + "'");
        }
    }
    if (this.clause.where_strings) {
        _ref1 = this.clause.where_strings;
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
            k = _ref1[_i];
            whereClause.push(k);
        }
    }
    if (fts = this._build_full_text_search()) {
        whereClause.push(fts);
    }
    return whereClause;
};


internals.dataset.prototype._build_limit = function() {

    var sql;
    sql = '';
    if (this.clause.paginate) {
        if (this.clause.limit) {
            throw new Error('`paginate`: You cannot paginate a dataset that already has a limit (Datastorm:Error)');
        }
        this.clause.limit = this.clause.paginate.record_count;
        this.clause.offset = (this.clause.paginate.page - 1) * this.clause.limit;
    }
    if (this.clause.limit) {
        sql += " LIMIT " + this.clause.limit;
    }
    if (this.clause.offset !== void 0 && this.clause.offset !== null) {
        sql += " OFFSET " + this.clause.offset;
    }
    if (sql.length === 0) {
        return null;
    }
    return sql;
};


internals.dataset.prototype.common_sql = function(type) {

    var whereClause = this._build_where();
    var sql = '';
    if (this.clause.join && type !== 'update') {
        sql += " " + this._build_join();
    }
    if (whereClause.length > 0) {
        sql += " WHERE " + whereClause.join(' AND ');
    }
    if (this.clause.order) {
        sql += " ORDER BY `" + this.clause.order + "`";
    }
    if (this.clause.group && type !== 'update') {
        sql += " GROUP BY `" + this.clause.group + "`";
    }
    var limit;
    if (limit = this._build_limit()) {
        sql += limit;
    }
    return sql;
};


internals.dataset.prototype.update_sql = function(data) {

    var field_name_str, field_value_str, k, setClause, sql, v;
    setClause = [];
    for (k in data) {
        v = data[k];
        field_name_str = this._stringify_field_names([k]);
        field_value_str = this._stringify_field_values([v]);
        setClause.push("" + field_name_str + " = " + field_value_str);
    }
    sql = "UPDATE `" + this.tableName + "`";
    if (this.clause.join) {
        sql += " " + this._build_join();
    }
    sql += " SET " + setClause.join(', ');
    sql += this.common_sql('update');
    return sql;
};


internals.dataset.prototype.delete_sql = function() {

    var sql;
    sql = "DELETE ";
    sql += this.clause.select ? this.clause.select.join(', ') : this.clause.join ? "`" + this.tableName + "`" : '*';
    sql += " FROM `" + this.tableName + "`";
    sql += this.common_sql();
    return sql;
};


internals.dataset.prototype.sql = function() {

    var sql;
    if (this.clause.raw.length) {
        sql = this.clause.raw.join(' ');
    } else {
        sql = "SELECT ";
        sql += this.clause.select ? this.clause.select.join(', ') : '*';
        sql += " FROM `" + this.tableName + "`";
    }
    sql += this.common_sql();
    return sql;
};


module.exports = internals.dataset;
