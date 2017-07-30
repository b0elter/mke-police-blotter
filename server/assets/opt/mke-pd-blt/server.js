const http = require('http');
const url = require('url');
const moment = require('moment');
const { Pool } = require('pg');
const pool = new Pool();

let sql = require('sql');
sql.setDialect('postgres');

const calls = sql.define({
    name: 'calls',
    columns: [
        'number',
        'date_time',
        'location',
        'district',
        'nature',
        'status',
        'latitude',
        'longitude'
    ]
});

let server = http.createServer((req, res) => {
    // don't need to do any routing, only respond to calls
    let route = url.parse(req.url, true);
    if (route.pathname !== '/calls') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not found.');
    }

    // default options
    let start = 0,
        limit = 10,
        sort = 'date_time',
        dir = 'DESC';

    let query = calls.select(calls.star()).from(calls);

    // where
    if (route.query.location) {
        query = query.where(calls.location.ilike(`%${route.query.location}%`));
    }
    if (route.query.nature) {
        query = query.where(calls.nature.ilike(`%${route.query.nature}%`));
    }
    if (route.query.status) {
        query = query.where(calls.nature.ilike(`%${route.query.status}%`));
    }
    if (route.query.district) {
        query = query.where(calls.district.equals(parseInt(route.query.district)));
    }

    // sort
    if (['location', 'nature', 'date_time', 'district', 'status'].includes(route.query.sort)) {
        sort = route.query.sort;
    }
    if (route.query.dir && route.query.dir !== 'DESC') {
        dir = 'ASC';
    }
    query = query.order(`${sort} ${dir}`);

    // start/limit
    if (route.query.start && !isNaN(parseInt(route.query.start))) {
        start = parseInt(route.query.start);
    }
    if (route.query.limit && !isNaN(parseInt(route.query.limit))) {
        limit = parseInt(route.query.limit);
    }
    query = query.limit(limit).offset(start);

    // finalize
    query = query.toQuery();

    pool.query({
        text: query.text,
        values: query.values
    }, (err, result) => {
        if (err) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Server Error.');
            console.error(err);
            return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result.rows));
    });

});

server.listen(3000);
