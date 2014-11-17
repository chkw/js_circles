#!/bin/sh
PYTHON=`which python`

PATH="./"

PORT="9988"

echo "server listening on port $PORT"
$PYTHON ./scripts/static_server.py $PATH $PORT
