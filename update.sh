#!/bin/sh

git submodule update --init

pushd deps/activejs
ruby build.rb
popd

cp -v deps/activejs/latest/active.js lib/activejs.js
cp -v deps/activejs/src/active_controller/server.js lib/activejs/activecontroller/server.js
cp -v deps/activejs/test/test.js tests/test.js
