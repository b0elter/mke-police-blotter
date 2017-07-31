# MKE Police Blotter

A little thing that scrapes police call data [provided by the city](http://itmdapps.milwaukee.gov/MPDCallData/currentCADCalls/callsService.faces).

Put it in a database, set up a GET endpoint, and fetch it on a responsive site.

## Built with
- Node.js
- PostgreSQL
- Polymer

## Demo
http://mboelter.com:8000/

## Usage
If you're on the docker train:

```$bash
$ npm install -g bower # a Polymer requiremnt for now
$ ./build.sh # concurrently pull & build Docker images, download bower deps
$ ./start.sh # run the things
```

## TODO/Limitations

- Only tested in Chrome
- Documentation would be cool
- Add build for static site (vulcanize,minify,transpile,etc...)
- Add service workers
- Add offline support
- Add notification subscriptions
- Websockets, why not?
- Add paging on both scraper and site
- Fix up scraper and schema to support updating a call
- HTTPS
- Monitoring and Error Reporting
