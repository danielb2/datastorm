{exec, spawn} = require('child_process')
fs = require 'fs'
task 'build', 'build the project', ->
  exec('coffee  -o lib/ -c src/*coffee')

version_bump = (type) ->
  data = JSON.parse fs.readFileSync('package.json')
  version = data['version']
  [major,minor,patch] = version.split('.')
  switch type
    when 'major'
      major = parseInt(major) + 1
      minor = 0
      patch = 0
    when 'minor'
      minor = parseInt(minor) + 1
      patch = 0
    when 'patch'
      patch = parseInt(patch) + 1

  new_version = [major,minor,patch].join('.')
  data['version'] = new_version

  fs.writeFileSync('package.json', JSON.stringify data, '', 2)

  console.log "old version #{version}"
  console.log "new version #{new_version}"

task 'version:bump:major', 'minor version bump', ->
  version_bump('major')
task 'version:bump:minor', 'minor version bump', ->
  version_bump('minor')
task 'version:bump:patch', 'minor version bump', ->
  version_bump('patch')
