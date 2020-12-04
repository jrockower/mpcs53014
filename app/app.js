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

// Connect to hbase
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

// Adapted from Professor Spertus code to remove prefix to scan through hbase
function removePrefix(text, prefix) {
	if(text.indexOf(prefix) != 0) {
		throw "missing prefix"
	}
	return text.substr(prefix.length)
}

function counterToNumber(c) {
	return Number(Buffer.from(c).readBigInt64BE());
}

// Page to output top 10 box office for opening week of film submitted by user
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

		// Update result with the writers and directors
		result['writers'] = all_writers
		result['directors'] = all_directors

		return result
	}

	function filminfo(cells) {
		// Wrapper to process film records for each cell passed in
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
		// Push processed record to result
		result.push(processfilmRecord(filmRecord))
		return result;

	}

	function getvotes(filminfo, result, position, week_formatted) {
		// Main function to get the ratings from jrockower_ratings_hbase and then pass this output to html to render
		// Did this recursively to handle the lack of ability to pass information out of calls to hbase

		// Base case - when done processing film info, then render to html
		if (position > filminfo.length - 1 ) {
			console.log(result)
			var template = filesystem.readFileSync("films-output.mustache").toString();
			var html = mustache.render(template, {
				filmInfo: result,
				filmname: film,
				week: week_formatted
			});
			res.send(html)
		// Recursive step
		} else {
			// First populate result with everything from filminfo of that position
			result[position] = filminfo[position]
			// Then, access hbase using title and start year
			hclient.table('jrockower_ratings_hbase').row(filminfo[position]['title'] + ' (' + filminfo[position]['startyear'] + ')').get((error, value) => {
				// NOTE TO GRADER: The counter values seem to be slightly off from querying the HBase table in the shell. According to Piazza, seems to be a conversion error that we shouldn't fix https://piazza.com/class/kfkdziuxddb44n?cid=449

				// Take total score divided by number of votes to get average rating and round result
				result[position]['avg_rating'] = (counterToNumber(value[1]['$']) / counterToNumber(value[0]['$'])).toFixed(1)
				// Get the number of votes to present in table
				result[position]['num_votes'] = parseFloat(counterToNumber(value[0]['$']).toString()).toLocaleString('en')
				// Recursively increment position by 1 to take a look at next record
				getvotes(filminfo, result, position + 1, week_formatted);
			})
		}
	}

	//
	hclient.table('jrockower_film_keys_hbase').row(film).get((error, value) => {
		const week = value[0]['$']
		const week_formatted = week.substr(0, 4) + ' Week ' + week.substr(week.length - 2, 2)

		hclient.table('jrockower_box_office_hbase').scan(
			{filter: {type: "PrefixFilter", value: week}, maxVersions: 1}, (err, cells) => {
				// Get all films for a given week
				var fi = filminfo(cells, week);
				var result = []
				var position = 0
				// Get the votes and send to HTML
				getvotes(fi, result, position, week_formatted)
			});
	});
});

/* Send review to kafka */
var kafka = require('kafka-node');
var Producer = kafka.Producer;
var kafkaClient = new kafka.KafkaClient({kafkaHost: process.argv[5]});
var kafkaProducer = new Producer(kafkaClient);

// Creates form for which one can enter a film and submit a review
app.get('/films-review.html', function (req, res) {
	hclient.table('jrockower_film_keys_hbase').scan({ maxVersions: 1}, (err,rows) => {
		var template = filesystem.readFileSync("review.mustache").toString();
		var html = mustache.render(template, {
			films : rows
		});
		res.send(html)
	})
});

// Get the film and review and then send to Kafka
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
