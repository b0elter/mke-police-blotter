var http = require('http');
var htmlparser = require('htmlparser');
var util = require('util');
var select = require('soupselect-update').select;
var moment = require('moment');

var options = {
    host: 'itmdapps.milwaukee.gov',
    path: '/MPDCallData/currentCADCalls/callsService.faces'
};

var parser = new htmlparser.Parser(new htmlparser.DefaultHandler(function(err, dom) {
    if (err) {
        throw err;
    }

    // last update
    var update = select(dom, '#formId:updatedId');
    if (update.length !== 1 || update[0].children.length !== 1) {
        throw 'Unexpected number of elements for update.';
    }
    update = moment(update[0].children[0].data, 'MM/DD/YYYY hh:mm:ss A');
    if (!update.isValid()) {
        throw 'Unable to parse update.'
    }

    ///////////

    // number of calls
    var total = select(dom, '#formId:textTotalCallId');
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
    var todo = total;

    console.log(todo);

    var rowToCall = function (index) {
        var call = {};
        var call_number = select(dom, '#formId:tableExUpdateId:' + index + ':text1');
        if (call_number.length === 1 && call_number[0].children.length === 1) {
            call.call_number = call_number[0].children[0].data;
            call.date_time = moment(select(dom, '#formId:tableExUpdateId:' + index + ':text2')[0].children[0].data, 'MM/DD/YYYY hh:mm:ss A');
            call.location = select(dom, '#formId:tableExUpdateId:' + index + ':text3')[0].children[0].data;
            call.district = select(dom, '#formId:tableExUpdateId:' + index + ':text4')[0].children[0].data;
            call.nature = select(dom, '#formId:tableExUpdateId:' + index + ':text5')[0].children[0].data;
            call.status = select(dom, '#formId:tableExUpdateId:' + index + ':text6')[0].children[0].data;
        }
        return call;
    };

    var calls = [];
    for (var i = 0; i < 20; i++) {
        var call = rowToCall(i);
        if (call.call_number) {
            calls.push(call);
        }
    }


    console.log(util.inspect(calls));
}));

callback = function(response) {
    var str = '';

    response.on('data', function (chunk) {
        str += chunk;
    });

    response.on('end', function () {
        parser.parseComplete(str);
    });
};

http.request(options, callback).end();
