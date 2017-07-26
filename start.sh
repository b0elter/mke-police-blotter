#!/usr/bin/env bash

##
# Environment
#
NETWORK=mke-pd-blt-network

POSTGRES_USER=mke_police
POSTGRES_PASSWORD=changeme
POSTGRES_DB=blotter
POSTGRES_NAME=mke-pd-blt-postgres

SCRAPER_NAME=mke-pd-blt-scraper
SCRAPER_IMAGE=mke-pd-blt-scraper

# Create network, ignore output of id or already exists
docker network create ${NETWORK} &> /dev/null

###
# Event functions
##
fail() {
    echo "Something went wrong..."
    echo "Stopping things we started..."

    docker stop "$@"
    docker rm "$@"

    exit 1
}

###
# Start containers
##

# Postgres for data store
POSTGRES=$(docker start ${POSTGRES_NAME} 2> /dev/null || docker run -d \
    -e POSTGRES_USER=${POSTGRES_USER} \
    -e POSTGRES_PASSWORD=${POSTGRES_PASSWORD} \
    -e POSTGRES_DB=${POSTGRES_DB} \
    --network ${NETWORK} \
    --publish-all \
    --hostname ${POSTGRES_NAME} \
    --name ${POSTGRES_NAME} \
    postgres:9.6.3)
trap "fail ${POSTGRES}" SIGKILL SIGINT EXIT

# Start node, interactive until things are working as expected
SCRAPER=$(docker start ${SCRAPER_NAME} 2> /dev/null || docker run -d \
    --network ${NETWORK} \
    --link ${POSTGRES_NAME}:${POSTGRES_NAME} \
    --name ${SCRAPER_NAME} \
    ${SCRAPER_IMAGE})
trap "fail ${POSTGRES} ${SCRAPER}" SIGKILL SIGINT EXIT

# Clear trap
trap - SIGKILL SIGINT EXIT

# Exit success
exit 0
