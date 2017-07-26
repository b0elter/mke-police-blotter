#!/usr/bin/env bash

./stop.sh

docker rm --volumes mke-pd-blt-postgres mke-pd-blt-scraper mke-pd-blt-server

docker network rm mke-pd-blt-network
