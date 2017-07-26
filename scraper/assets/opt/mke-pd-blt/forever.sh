#!/usr/bin/env bash

SLEEP=120

database_ready() {
    curl --silent --connect-timeout 1 http://${PGHOST}:${PGPORT}
    echo $?
}

echo "Waiting for database to be ready..."
while [ $(database_ready) -ne  "52" ]; do
    sleep 1
done

set -e

echo "Run schema initialization..."
node init-schema.js

echo "Begin polling data source..."
while [ true ]; do
    node scraper.js
    sleep ${SLEEP}
done
