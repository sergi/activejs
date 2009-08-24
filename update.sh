#!/bin/sh

git submodule update --init

pushd deps/activejs
ruby build.rb
popd

cp deps/activejs/latest/active.js lib/activejs.js
cp deps/activejs/test/test.js tests/test.js
