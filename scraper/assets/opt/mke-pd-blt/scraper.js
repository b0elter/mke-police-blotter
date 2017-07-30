const http = require('http');
const htmlparser = require('htmlparser');
const select = require('soupselect-update').select;
const moment = require('moment');
const { Pool } = require('pg');
const pool = new Pool();
const NodeGeocoder = require('node-geocoder');

const geocoder = NodeGeocoder({
    provider: 'google',
    apiKey: 'AIzaSyDk4xUvKgXj7aa8jdRabamZhVEGs3E6RE4'
});

const options = {
    host: 'itmdapps.milwaukee.gov',
    path: '/MPDCallData/currentCADCalls/callsService.faces'
};

function insert(call, callback) {
    pool.query(`
            INSERT INTO calls (
                number,
                date_time,
                location,
                district,
                nature,
                status,
                latitude,
                longitude
            ) VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                $7,
                $8
            )
        `, [
        call.number,
        call.date_time.format(),
        call.location,
        call.district,
        call.nature,
        call.status,
        call.latitude || null,
        call.longitude || null
    ], callback);
}

const parser = new htmlparser.Parser(new htmlparser.DefaultHandler((err, dom) => {
    if (err) {
        throw err;
    }

    // last update
    let update = select(dom, '#formId:updatedId');
    if (update.length !== 1 || update[0].children.length !== 1) {
        throw 'Unexpected number of elements for update.';
    }
    update = moment(update[0].children[0].data, 'MM/DD/YYYY hh:mm:ss A');
    if (!update.isValid()) {
        throw 'Unable to parse update.'
    }

    ///////////

    // number of calls
    let total = select(dom, '#formId:textTotalCallId');
    if (total.length !== 1 || total[0].children.length !== 1) {
        throw 'Unexpected number of elements for total.';
    }
    total = /\d+$/.exec(total[0].children[0].data);
    if (!total) {
        throw 'Unable to parse total.'
    }
    total = parseInt(total[0]);

    if (total === 0) {
        return console.log('Nothing to do...');
    }

    // assume 6 col x 0-20 rows
    let rowToCall = function (index) {
        let call = {};
        let number = select(dom, '#formId:tableExUpdateId:' + index + ':text1');
        if (number.length === 1 && number[0].children.length === 1) {
            call.number = number[0].children[0].data;
            call.date_time = moment(select(dom, '#formId:tableExUpdateId:' + index + ':text2')[0].children[0].data, 'MM/DD/YYYY hh:mm:ss A');
            call.location = select(dom, '#formId:tableExUpdateId:' + index + ':text3')[0].children[0].data;
            call.district = select(dom, '#formId:tableExUpdateId:' + index + ':text4')[0].children[0].data;
            call.nature = select(dom, '#formId:tableExUpdateId:' + index + ':text5')[0].children[0].data;
            call.status = select(dom, '#formId:tableExUpdateId:' + index + ':text6')[0].children[0].data;
        }
        return call;
    };

    let calls = [];
    let todo = Math.min(total, 20);
    for (let i = 0; i < 20; i++) {
        let call = rowToCall(i);
        if (call.number) {

            // sanitize location
            call.location = call.location.replace(/,MKE$/, ', Milwaukee, WI');

            if (call.location.length >= 5) {
                // attempt geocode lookup
                geocoder.geocode(call.location, function(err, res) {
                    if (res && res.length) {
                        call.latitude = res[0].latitude;
                        call.longitude = res[0].longitude;
                    }
                    insert(call, (err, res) => {
                        if (err) {
                            console.log(err);
                        }
                        if (--todo === 0) {
                            process.exit(0);
                        }
                    });
                    calls.push(call);
                });
            }
            else {
                insert(call, (err, res) => {
                    if (err) {
                        console.log(err);
                    }
                    if (--todo === 0) {
                        process.exit(0);
                    }
                });
                calls.push(call);
            }
        }
    }

    console.log(calls);
}));

http.request(options, (response) => {
    let str = '';

    response.on('data', (chunk) => {
        str += chunk;
    });

    response.on('end', () => {
        parser.parseComplete(str);
    });
}).end();
