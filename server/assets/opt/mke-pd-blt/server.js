const http = require('http');
const url = require('url');
const moment = require('moment');
const { Pool } = require('pg');
const pool = new Pool();

let server = http.createServer((req, res) => {
    // don't need to do any routing, only respond to calls
    let route = url.parse(req.url);
    if (route.pathname !== '/calls') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not found.');
    }

    // fetch calls
    let start = 0,
        limit = 20,
        sort = 'date_time',
        dir = 'DESC';

    pool.query({
        text: 'SELECT * FROM calls;',
        values: []
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
