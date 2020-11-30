'use strict';
const http = require('http');
var assert = require('assert');
const express = require('express');

if (typeof window !== "undefined") {
	require("jquery");
	require("bootstrap");
}

// const bootstrap = require('bootstrap');
const app = express();
const mustache = require('mustache');
const filesystem = require('fs');
const url = require('url');
const port = Number(process.argv[2]);

const hbase = require('hbase')
var hclient = hbase({ host: process.argv[3], port: Number(process.argv[4])})

function rowToMap(row) {
	var stats = {}
	row.forEach(function (item) {
		stats[item['column']] = Number(item['$'])
	});
	return stats;
}

hclient.table('jrockower_box_office_hbase').row('2020W101').get((error, value) => {
	console.info(rowToMap(value))
	console.info(value)
})

hclient.table('jrockower_film_keys_hbase').row('Superman II (1980)').get((error, value) => {
	console.info(rowToMap(value))
	console.info(value)
})

app.use(express.static('public'));

app.get('/')

app.get('/films-request.html', function (req, res) {
	hclient.table('jrockower_film_keys_hbase').scan({ maxVersions: 1}, (err,rows) => {
		var template = filesystem.readFileSync("films.mustache").toString();
		var html = mustache.render(template, {
			films : rows
		});
		res.send(html)
	})
});

function removePrefix(text, prefix) {
	if(text.indexOf(prefix) != 0) {
		throw "missing prefix"
	}
	return text.substr(prefix.length)
}

app.get('/airline-ontime-delays.html',function (req, res) {
	const airline=req.query['airline'];
	console.log(airline);
	function processYearRecord(yearRecord) {
		var result = { year : yearRecord['year']};
		["all", "clear", "fog", "hail", "rain", "snow", "thunder", "tornado"].forEach(weather => {
			var flights = yearRecord[weather + '_flights']
			var ontime_flights = yearRecord[weather + "_ontime"]
			result[weather] = flights == 0 ? "-" : (100 * ontime_flights/flights).toFixed(1)+'%';
		})
		return result;
	}
	function airlineInfo(cells) {
		var result = [];
		var yearRecord;
		cells.forEach(function(cell) {
			var year = Number(removePrefix(cell['key'], airline))
			if(yearRecord === undefined)  {
				yearRecord = { year: year }
			} else if (yearRecord['year'] != year ) {
				result.push(processYearRecord(yearRecord))
				yearRecord = { year: year }
			}
			yearRecord[removePrefix(cell['column'],'stats:')] = Number(cell['$'])
		})
		result.push(processYearRecord(yearRecord))
		console.info(result)
		return result;
	}

	hclient.table('spertus_ontime_by_year').scan({
			filter: {type : "PrefixFilter",
				value: airline},
			maxVersions: 1},
		(err, cells) => {
			var ai = airlineInfo(cells);
			var template = filesystem.readFileSync("ontime-result.mustache").toString();
			var html = mustache.render(template, {
				airlineInfo : ai,
				airline : airline
			});
			res.send(html)

		})
});

app.listen(port);
