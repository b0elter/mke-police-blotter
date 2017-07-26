#!/usr/bin/env bash

./stop.sh

docker rm --volumes mke-pd-blt-postgres mke-pd-blt-scraper

docker network rm mke-pd-blt-network
