Inspired by [Sequel] for ruby, sequel-node aims to be a database toolkit for
[node]

* Sequel-node currently has adapters for mysql

# A short example #

    var Sequel = require('sequel');

    DB = new Sequel.mysql({username: 'root', password: '', host: 'localhost', database: 'sequel_test'})

    items = DB.ds('items') // create a dataset

    // print out the number of records
    items.count(function(err, count) { console.log(count); })

# An Introduction #

Like [Sequel], Sequel-node uses the concept of datasets to retrieve data. A Dataset
object encapsulates an SQL query and supports chainability, letting you fetch
data using a convenient JavaScript DSL that is both concise and flexible.

Sequel uses the same concepts of datasets to retrieve data. A Dataset object
encapsulates an SQL query and supports chainability, letting you fetch data
using a convenient JavaScript DSL that is both concise and flexible.

    DB.ds('countries').where({region: 'Middle East'}).count()

is equivalent to

    SELECT COUNT(*) as count FROM `countries` WHERE region='Middle East'


[Sequel]: http://sequel.rubyforge.org/
[node]: http://nodejs.org/
