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

hclient.table('jrockower_box_office_hbase').row('2020W101').get((error, value) => {
	console.info(value)
})

hclient.table('jrockower_film_keys_hbase').row('Superman II (1980)').get((error, value) => {
	console.info(value)
})

app.use(express.static('public'));
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

app.get('/films-request-output.html', function (req, res) {
	const film = req.query['film'];
	console.log(film);

	// function processfilmRecord(filmrecord) {
	// 	var result = { rank : filmrecord['rank']};
	// 	["all", "clear", "fog", "hail", "rain", "snow", "thunder", "tornado"].forEach(weather => {
	// 		var flights = yearRecord[weather + '_flights']
	// 		var ontime_flights = yearRecord[weather + "_ontime"]
	// 		result[weather] = flights == 0 ? "-" : (100 * ontime_flights/flights).toFixed(1)+'%';
	// 	})
	// 	console.log(result);
	// 	return result;
	// }

	function filminfo(cells, week) {
		var result = [];
		var filmRecord;
		cells.forEach(function (cell) {
			// console.info(cell['key'])
			// console.log(film)
			var rank = Number(removePrefix(cell['key'], week))
			if(filmRecord === undefined) {
				filmRecord = { rank: rank }
			} else if (filmRecord['rank'] != rank ) {
				// result.push(processfilmRecord(filmRecord))
				result.push(filmRecord)
				console.log(filmRecord)
				filmRecord = { rank: rank }
			}
			filmRecord[removePrefix(cell['column'],'films:')] = cell['$']
		})
		// result.push(processfilmRecord(filmRecord))
		result.push(filmRecord)
		// console.info(result)
		return result;

	}

	hclient.table('jrockower_film_keys_hbase').row(film).get((error, value) => {
		console.info(value)
		const week = value[0]['$']

		hclient.table('jrockower_box_office_hbase').scan(
			{filter: {type : "PrefixFilter", value: week}, maxVersions: 1}, (err, cells) => {
				console.info(cells);
				var fi = filminfo(cells, week);
				console.info(fi);
				var template = filesystem.readFileSync("films-output.mustache").toString();
				var html = mustache.render(template, {
					filmInfo : fi,
					filmname : film
				});
				res.send(html)
			});
	})

})

app.get('/airline-ontime.html', function (req, res) {
	hclient.table('spertus_carriers').scan({ maxVersions: 1}, (err,rows) => {
		var template = filesystem.readFileSync("airline-ontime.mustache").toString();
		var html = mustache.render(template, {
			airlines : rows
		});
		res.send(html)
	})
});

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
		// console.log('here');
		// console.log(result);
		return result;
	}
	function airlineInfo(cells) {
		var result = [];
		var yearRecord;
		cells.forEach(function(cell) {
			console.info('printing cell')
			console.info(cell)
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
