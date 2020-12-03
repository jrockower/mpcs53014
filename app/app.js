'use strict';

//Note: Code adapted from Professor Spertus flights and weather application
const express = require('express');
if (typeof window !== "undefined") {
	require("jquery");
	require("bootstrap");
}

const app = express();
const mustache = require('mustache');
const filesystem = require('fs');
const port = Number(process.argv[2]);

const hbase = require('hbase')
var hclient = hbase({ host: process.argv[3], port: Number(process.argv[4])})

app.use(express.static('public'));

//Create Films Request main page. Includes form for user to submit.
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

function counterToNumber(c) {
	return Number(Buffer.from(c).readBigInt64BE());
}

app.get('/films-request-output.html', function (req, res) {
	const film = req.query['film'];
	console.log(film);

	function processfilmRecord(filmRecord) {
		//Each film may have multiple writers/directors. This code creates a concatenated version to display in table.
		var result = filmRecord;
		var writer1 = result["writer1"];
		const director1 = result["director1"];

		if ("writer2" in filmRecord) {
			if ("writer3" in filmRecord) {
				var all_writers = writer1 + ', ' + filmRecord["writer2"] + ', ' + filmRecord["writer3"]
			} else {
				var all_writers = writer1 + ', ' + filmRecord["writer2"]
			}
		} else {
			var all_writers = writer1
		}

		if ("director2" in filmRecord) {
			if ("director3" in filmRecord) {
				var all_directors = director1 + ', ' + filmRecord["director2"] + ', ' + filmRecord["director3"]
			} else {
				var all_directors = director1 + ', ' + filmRecord["director2"]
			}
		} else {
			var all_directors = director1
		}

		result['writers'] = all_writers
		result['directors'] = all_directors

		// Change format of number of votes to use comma format
		result['num_votes'] = parseFloat(counterToNumber(filmRecord['num_votes']).toString()).toLocaleString('en')
		console.log(result)
		return result
	}

	function filminfo(cells) {
		var result = [];
		var filmRecord;
		cells.forEach(function (cell) {
			var rank = Number(cell['key'].substring(cell['key'].length - 2))
			if(filmRecord === undefined) {
				filmRecord = { rank: rank }
			} else if (filmRecord['rank'] != rank ) {
				result.push(processfilmRecord(filmRecord))
				filmRecord = { rank: rank }
			}
			filmRecord[removePrefix(cell['column'],'films:')] = cell['$']
		})
		result.push(processfilmRecord(filmRecord))
		return result;

	}

	hclient.table('jrockower_film_keys_hbase').row(film).get((error, value) => {
		const week = value[0]['$']
		const week_formatted = week.substr(0, 4) + ' Week ' + week.substr(week.length - 2, 2)

		hclient.table('jrockower_box_office_hbase').scan(
			{filter: {type: "PrefixFilter", value: week}, maxVersions: 1}, (err, cells) => {
				var fi = filminfo(cells, week);
				// hclient.table('jrockower_ratings_hbase').row(filmRecord['title'] + ' (' + filmRecord['startyear'] + ')').get((error, value) => {
				// 	console.log(parseFloat(counterToNumber(value[0]['$']).toString()).toLocaleString('en'))
				// 	var votes = parseFloat(counterToNumber(value[0]['$']).toString()).toLocaleString('en')
				// })
				console.log(fi)
				var template = filesystem.readFileSync("films-output.mustache").toString();
				var html = mustache.render(template, {
					filmInfo: fi,
					filmname: film,
					week: week_formatted
				});
				res.send(html)
			});
	});
});

/* Send review to kafka */
var kafka = require('kafka-node');
var Producer = kafka.Producer;
var kafkaClient = new kafka.KafkaClient({kafkaHost: process.argv[5]});
var kafkaProducer = new Producer(kafkaClient);

app.get('/films-review.html', function (req, res) {
	hclient.table('jrockower_film_keys_hbase').scan({ maxVersions: 1}, (err,rows) => {
		var template = filesystem.readFileSync("review.mustache").toString();
		var html = mustache.render(template, {
			films : rows
		});
		res.send(html)
	})
});

app.get('/review.html', function (req, res) {
	var film_val = req.query['film'];
	var review_val = req.query['review'];

	var report = {
		film: film_val,
		review: review_val
	};

	console.log(report)

	kafkaProducer.send([{topic: 'jrockower-film-ratings', messages: JSON.stringify(report)}],
		function(err, data) {
			console.log("Kafka Error: " + err);
			console.log(data);
			console.log(report);
			res.redirect('/films-review.html');
		});

});
app.listen(port);
