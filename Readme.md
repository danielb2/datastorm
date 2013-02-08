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


# Sequel Models #
A model class wraps a dataset, and an instance of that class wraps a single
record in the dataset.

Model classes are defined as regular Ruby classes inheriting from
Sequel.Model

Using coffee script syntax (use http://js2coffee.org/ to translate) for sake
of abbriviation:

DB = new Sequel.mysql {username: 'root', password: '', host: 'localhost', database: 'sequel_test'}
    class Post extends Sequel.Model

Sequel model classes assume that the table name is an underscored plural of
the class name:

    Post.table_name() //=> :posts

## Model Validations ##
You can define a validate method for your model, which save will check before
attempting to save the model in the database. If an attribute of the model
isn't valid, you should add a error message for that attribute to the model
object's errors. If an object has any errors added by the validate method,
save will return an error.

    class Post extends Sequel.Model
      @validate 'name', (name) ->
        @errors.add name, "cant be bob" if name == 'bob'

[Sequel]: http://sequel.rubyforge.org/
[node]: http://nodejs.org/
