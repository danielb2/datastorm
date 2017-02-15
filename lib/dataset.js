'use strict';

const internals = {};


internals.dataset = function (connection, tableName) {

    this.connection = connection;
    this.tableName = tableName;
    this.clause = {
        raw: []
    };
};


internals.dataset.prototype.merge = function (obj1, obj2) {

    const obj3 = {};
    let i;
    for (i in obj1) {
        obj3[i] = obj1[i];
    }
    for (i in obj2) {
        obj3[i] = obj2[i];
    }
    return obj3;
};


internals.dataset.prototype.clone = function (additions) {

    const new_obj = this.merge(this, {});
    new_obj.clause = this.merge(this.clause, additions);
    return new_obj;
};


internals.dataset.prototype.set_row_func = function (func) {

    this.row_func = func;
};


internals.dataset.prototype.row_func = function (row) {

    return row;
};


internals.dataset.prototype.where = function (conditions) {

    if (toString.call(conditions) === '[object String]') {
        const new_where = this.clause.where_strings ? (this.clause.where_strings.push(conditions), this.clause.where_strings) : [conditions];
        return this.clone({
            where_strings: new_where
        });
    }

    const new_where = this.clause.where ? this.merge(this.clause.where, conditions) : conditions;
    return this.clone({
        where: new_where
    });
};


internals.dataset.prototype.raw = function (sql) {

    return this.clone({
        raw: this.clause.raw.concat(sql)
    });
};


internals.dataset.prototype.limit = function (limit, offset) {

    const new_obj = this.clone({
        limit,
        offset
    });
    return new_obj;
};


internals.dataset.prototype.full_text_search = function (fields, query) {

    return this.clone({
        full_text_search: {
            fields,
            query
        }
    });
};


internals.dataset.prototype.order = function (order) {

    return this.clone({
        order
    });
};


internals.dataset.prototype.group = function (group) {

    return this.clone({
        group
    });
};


internals.dataset.prototype.paginate = function (page, record_count) {

    return this.clone({
        paginate: {
            page,
            record_count
        }
    });
};


internals.dataset.prototype.join = function (table_name, conditions) {

    return this.clone({
        join: {
            table_name,
            conditions
        }
    });
};


internals.dataset.prototype.query = function (sql, cb) {

    if (process.env.DEBUG) {
        console.log(sql);
    }
    return this.connection.query(sql, (err, results, fields) => {

        return cb(err, results, fields);
    });
};


internals.dataset.prototype.all = function (cb) {

    const self = this;

    return this.query(this.sql(), (err, result, fields) => {

        if (err) {
            return cb(err);
        }
        return cb(err, (() => {

            const results = [];
            for (let i = 0; i < result.length; ++i) {
                const res = result[i];
                results.push(self.row_func(res));
            }
            return results;
        }).call(self), fields);
    });
};


internals.dataset.prototype.first = function (cb) {

    const self = this;
    return this.query(this.limit(1).sql(), (err, result, fields) => {

        if (err) {
            return cb(err);
        }
        return cb(err, ((function () {

            const results = [];
            for (let i = 0; i < result.length; ++i) {
                const res = result[i];
                results.push(self.row_func(res));
            }
            return results;
        }).call(self))[0], fields);
    });
};


internals.dataset.prototype.count = function (cb) {

    return this.query(this.select('COUNT(*) as count').sql(), (err, result, fields) => {

        if (err) {
            return cb(err);
        }
        return cb(err, result[0].count, fields);
    });
};


internals.dataset.prototype.select = function () {

    const fields = arguments.length >= 1 ? [].slice.call(arguments, 0) : [];
    return this.clone({
        select: fields
    });
};


internals.dataset.prototype._build_full_text_search = function () {

    if (!this.clause.full_text_search) {
        return null;
    }
    const params = this._stringify_field_names(this.clause.full_text_search.fields);
    const query = this._stringify_field_values([this.clause.full_text_search.query]);
    return '(MATCH (' + params + ') AGAINST (' + query + '))';
};


internals.dataset.prototype._build_join = function () {

    const join_query = 'INNER JOIN `' + this.clause.join.table_name + '`';
    if (this.clause.join.conditions) {
        const ref = this.clause.join.conditions;
        for (const k in ref) {
            const v = ref[k];
            const key = '`' + this.clause.join.table_name + '`.`' + k + '`';
            const value = '`' + this.tableName + '`.`' + v + '`';
            return join_query + (' ON (' + key + '=' + value + ')');
        }
    }
    else {
        return join_query;
    }
};


internals.dataset.prototype.insert_sql = function (data) {

    const field_names = [];
    const field_values = [];

    for (const k in data) {
        const v = data[k];
        field_names.push(k);
        field_values.push(v);
    }
    const field_name_str = this._stringify_field_names(field_names);
    const field_value_str = this._stringify_field_values(field_values);
    return 'INSERT INTO `' + this.tableName + '` (' + field_name_str + ') VALUES (' + field_value_str + ')';
};


internals.dataset.prototype.insert = function (data, cb) {

    return this.query(this.insert_sql(data), (err, result, fields) => {

        if (err) {
            return cb(err);
        }
        return cb(err, result.insertId, fields);
    });
};


internals.dataset.prototype.delete = function (cb) {

    return this.query(this.delete_sql(), (err, result, fields) => {

        if (err) {
            return cb(err);
        }
        return cb(err, result.affectedRows, fields);
    });
};


internals.dataset.prototype.update = function (data, cb) {

    return this.query(this.update_sql(data), (err, result, fields) => {

        if (err) {
            return cb(err);
        }
        return cb(err, result.affectedRows, fields);
    });
};


internals.dataset.prototype.truncate = function (cb) {

    return this.query('TRUNCATE `' + this.tableName + '`', (err, result) => {

        if (err) {
            return cb(err);
        }
        return cb(err, result.affectedRows);
    });
};


internals.dataset.prototype.execute = function (sql, cb) {

    return this.query(sql, cb);
};

internals.dataset.prototype._stringify_field_names = function (array) {

    return JSON.stringify(array).replace(/"/g, '`', 'gi').replace(/[\[\]]/g, '');
};


internals.dataset.prototype._stringify_field_values = function (array) {

    if (this.connection.escape) {
        return this.connection.escape(array);
    }
    return escape(array);
};


internals.dataset.prototype._build_where = function () {

    const whereClause = [];
    const ref = this.clause.where;
    for (const k in ref) {
        const v = ref[k];
        const field_name_str = this._stringify_field_names([k]);
        const field_value_str = this._stringify_field_values([v]);
        if (toString.call(v) === '[object Array]') {
            whereClause.push('' + field_name_str + ' IN ' + field_value_str);
        }
        else {
            whereClause.push('' + k + '=\'' + v + '\'');
        }
    }
    if (this.clause.where_strings) {
        const ref1 = this.clause.where_strings;
        for (let i = 0; i < ref1.length; ++i) {
            const k = ref1[i];
            whereClause.push(k);
        }
    }
    let fts;
    if (fts = this._build_full_text_search()) {
        whereClause.push(fts);
    }
    return whereClause;
};


internals.dataset.prototype._build_limit = function () {

    let sql = '';
    if (this.clause.paginate) {
        if (this.clause.limit) {
            throw new Error('`paginate`: You cannot paginate a dataset that already has a limit (Datastorm:Error)');
        }
        this.clause.limit = this.clause.paginate.record_count;
        this.clause.offset = (this.clause.paginate.page - 1) * this.clause.limit;
    }
    if (this.clause.limit) {
        sql += ' LIMIT ' + this.clause.limit;
    }
    if (this.clause.offset !== void 0 && this.clause.offset !== null) {
        sql += ' OFFSET ' + this.clause.offset;
    }
    if (sql.length === 0) {
        return null;
    }
    return sql;
};


internals.dataset.prototype.common_sql = function (type) {

    const whereClause = this._build_where();
    let sql = '';
    if (this.clause.join && type !== 'update') {
        sql += ' ' + this._build_join();
    }
    if (whereClause.length > 0) {
        sql += ' WHERE ' + whereClause.join(' AND ');
    }
    if (this.clause.order) {
        sql += ' ORDER BY `' + this.clause.order + '`';
    }
    if (this.clause.group && type !== 'update') {
        sql += ' GROUP BY `' + this.clause.group + '`';
    }
    const limit = this._build_limit();
    if (limit) {
        sql += limit;
    }
    return sql;
};


internals.dataset.prototype.update_sql = function (data) {

    const setClause = [];
    for (const k in data) {
        const v = data[k];
        const field_name_str = this._stringify_field_names([k]);
        const field_value_str = this._stringify_field_values([v]);
        setClause.push('' + field_name_str + ' = ' + field_value_str);
    }
    let sql = 'UPDATE `' + this.tableName + '`';
    if (this.clause.join) {
        sql += ' ' + this._build_join();
    }
    sql += ' SET ' + setClause.join(', ');
    sql += this.common_sql('update');
    return sql;
};


internals.dataset.prototype.delete_sql = function () {

    let sql = 'DELETE ';
    sql += this.clause.select ? this.clause.select.join(', ') : this.clause.join ? '`' + this.tableName + '`' : '';
    sql += ' FROM `' + this.tableName + '`';
    sql += this.common_sql();
    return sql;
};


internals.dataset.prototype.sql = function () {

    let sql;
    if (this.clause.raw.length) {
        sql = this.clause.raw.join(' ');
    }
    else {
        sql = 'SELECT ';
        sql += this.clause.select ? this.clause.select.join(', ') : '*';
        sql += ' FROM `' + this.tableName + '`';
    }
    sql += this.common_sql();
    return sql;
};


module.exports = internals.dataset;
