#!/usr/bin/env bash

build_static_site() {
    pushd site/assets/opt/mke-pd-blt
    bower install
    popd
    docker build -t mke-pd-blt-site site
}

build_static_site &
docker pull postgres:9.6.3 &
docker build -t mke-pd-blt-scraper scraper &
docker build -t mke-pd-blt-server server &

wait
