#!/usr/bin/env bash

SLEEP=120

while [ true ]; do
    node scraper.js
    sleep ${SLEEP}
done
