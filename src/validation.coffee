integer = (name, value, done) ->
  @errors.add value, 'is not a number' unless (typeof value == 'number' || toString.call(value) == '[object Number]';)
  done()

unique = (name, value, done) ->
  @constructor.where(name: value).first (err, result) =>
    @errors.add name, 'is already taken' if result
    done()

presence = (name, value, done) ->
  @errors.add name, 'is not present' unless value
  done()

email = (name, value, done) ->
  email_regexp = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i
  @errors.add name, 'is not an email' unless email_regexp.test(value)
  done()

module.exports =
  integer: integer
  unique: unique
  numeric: integer
  presence: presence
  email: email
