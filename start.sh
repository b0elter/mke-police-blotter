#!/usr/bin/env bash

##
# Environment
#
NETWORK=mke-pd-blt-network

POSTGRES_USER=$(uuidgen)
POSTGRES_PASSWORD=$(uuidgen)
POSTGRES_DB=$(uuidgen)
POSTGRES_NAME=mke-pd-blt-postgres
POSTGRES_IMAGE=postgres:9.6.3

# Look for existing POSTGRES env to use instead of random
UUIDRE="[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}"
EXISTING=$(docker inspect -f '{{.Config.Env}}' ${POSTGRES_NAME} 2> /dev/null)

if [ "$?" -eq "0" ]; then
    POSTGRES_USER=$(echo "${EXISTING}" | sed -e "s/.*POSTGRES_USER=\([a-f0-9-]*\).*/\1/")
    POSTGRES_PASSWORD=$(echo "${EXISTING}" | sed -e "s/.*POSTGRES_PASSWORD=\([a-f0-9-]*\).*/\1/")
    POSTGRES_DB=$(echo "${EXISTING}" | sed -e "s/.*POSTGRES_DB=\([a-f0-9-]*\).*/\1/")
fi

SCRAPER_NAME=mke-pd-blt-scraper
SCRAPER_IMAGE=mke-pd-blt-scraper

SERVER_NAME=mke-pd-blt-server
SERVER_IMAGE=mke-pd-blt-server

SITE_NAME=mke-pd-blt-site
SITE_IMAGE=mke-pd-blt-site

set -e

# Create network, ignore output of id or already exists
docker network create ${NETWORK} &> /dev/null

###
# Event functions
##
fail() {
    echo "Something went wrong..."
    echo "Stopping things we started..."

    docker stop "$@"

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
    --network-alias=${POSTGRES_NAME} \
    --name ${POSTGRES_NAME} \
    ${POSTGRES_IMAGE})
trap "fail ${POSTGRES}" SIGKILL SIGINT EXIT

# Scraper fetches remote data and inserts into data store
SCRAPER=$(docker start ${SCRAPER_NAME} 2> /dev/null || docker run -d \
    -e PGUSER=${POSTGRES_USER} \
    -e PGHOST=${POSTGRES_NAME} \
    -e PGPASSWORD=${POSTGRES_PASSWORD} \
    -e PGDATABASE=${POSTGRES_DB} \
    -e PGPORT=5432 \
    --network ${NETWORK} \
    --network-alias=${SCRAPER_NAME} \
    --add-host ${POSTGRES_NAME}:$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' ${POSTGRES}) \
    --name ${SCRAPER_NAME} \
    ${SCRAPER_IMAGE})
trap "fail ${POSTGRES} ${SCRAPER}" SIGKILL SIGINT EXIT

# Server is psuedo RESTful endpoint for data store
SERVER=$(docker start ${SERVER_NAME} 2> /dev/null || docker run -d \
    -e PGUSER=${POSTGRES_USER} \
    -e PGHOST=${POSTGRES_NAME} \
    -e PGPASSWORD=${POSTGRES_PASSWORD} \
    -e PGDATABASE=${POSTGRES_DB} \
    -e PGPORT=5432 \
    --network ${NETWORK} \
    --network-alias=${SERVER_NAME} \
    --add-host ${POSTGRES_NAME}:$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' ${POSTGRES}) \
    --name ${SERVER_NAME} \
    ${SERVER_IMAGE})
trap "fail ${POSTGRES} ${SCRAPER} ${SERVER}" SIGKILL SIGINT EXIT

# Site is responsible for serving static page, only needs to see server
SITE=$(docker start ${SITE_NAME} 2> /dev/null || docker run -d \
    --network ${NETWORK} \
    --network-alias=${SITE_NAME} \
    --add-host ${SERVER_NAME}:$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' ${SERVER}) \
    --name ${SITE_NAME} \
    --publish 80:80 \
    ${SITE_IMAGE})
trap "fail ${POSTGRES} ${SCRAPER} ${SERVER} ${SITE}" SIGKILL SIGINT EXIT

# Clear trap
trap - SIGKILL SIGINT EXIT

# Exit success
exit 0
