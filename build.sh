#!/usr/bin/env bash

docker build -t mke-pd-blt-scraper scraper &
docker build -t mke-pd-blt-server server &

wait

exit 0
