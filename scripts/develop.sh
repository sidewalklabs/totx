#!/bin/bash

# Run a server, watching for server and client code changes.
# The first argument is the name of the package to run (e.g. onemap).
# Subsequent argments will be passed to the server, e.g.
#
#     ./scripts/develop.sh onemap --read-only

cd $(dirname $0)/.. || exit 1

package=$1
shift

webpack_config=packages/$package/webpack.config.js
if [[ ! -f $webpack_config ]]; then
    echo ''
fi

PATH=$PWD/node_modules/.bin:$PATH

webpack --config $webpack_config
webpack --config $webpack_config --progress --colors --watch &
nodemon --watch 'server/*.ts' --exec 'ts-node' packages/$package/server/server.ts $@

# kill any remaining background processes
jobs -p | xargs kill
