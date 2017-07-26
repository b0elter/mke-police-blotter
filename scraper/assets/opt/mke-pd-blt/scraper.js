const http = require('http');
const htmlparser = require('htmlparser');
const util = require('util');
const select = require('soupselect-update').select;
const moment = require('moment');

const options = {
    host: 'itmdapps.milwaukee.gov',
    path: '/MPDCallData/currentCADCalls/callsService.faces'
};

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
    for (let i = 0; i < 20; i++) {
        let call = rowToCall(i);
        if (call.number) {
            calls.push(call);
        }
    }

    console.log(util.inspect(calls));
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
