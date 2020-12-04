# Big Data Application Architecture Final Project

# Purpose
The idea for this project came from the [Blank Check Podcast with Griffin and David](https://soundcloud.com/griffin-and-david-present). At the end of each episode of the podcast, they play the "Box Office Game" in which Griffin must guess the top 5 movies at the box office in the week in which the movie they're discussing originally came out. Often while bringing up [Box Office Mojo](boxofficemojo.com), they mention that the site is challenging to navigate. I wanted to build a tool that could be used for a similar purpose, with a simple user input.

To make the scraping process shorter for the limited purpose of this project, I scraped the top 10 of every weekend in the Box Office Mojo database. I also have determined the "opening weekend" to be the first weekend in which a film was in the *top 10 at the box office*. This avoids any kind of complication related to movies that start in limited release and then expand later. However, it also limits the analysis to any movies that were *ever* in the top 10 at the box office and could include movies that started lower and then moved into the top 10.

# How to Use
* The user is first asked to think of a film for which they are interested in seeing opening weekend box office information.
* From `http://mpcs53014-loadbalancer-217964685.us-east-2.elb.amazonaws.com:3049/films-request.html` a user enters the name of a film using the dropdown menu.
* After submitting, a table is displayed including some basic information about each film for the top 10 in the opening weekend of the film submitted.
* If the user is interested in looking up another film, they can either go back in their browser or click the "Enter another film" button in the upper-left hand corner of the page.

# Step 1 - Ingest Data
* [BoxOfficeMojo.py](./BoxOfficeMojo.py)
    * Python script to scrape the Box Office Mojo Site.
    * Gets domestic all-time rankings along with weekend box office results.
    * Note this takes several hours to run in total.
    * Saves directly to S3:
      * `s3://jrockower-mpcs53014/lifetime_box_office/lifetime_box_office.csv`
      * `s3://jrockower-mpcs53014/weekly_box_office/weekly_box_office.csv`
* [get_imdb.sh](./get_imdb.sh)
    * Shell script to get IMDb data.
    * To copy to Hadoop, use:
      * `scp -i ~/.ssh/jrockower.pem /home/jrockower/git/mpcs53014/get_imdb.sh hadoop@ec2-52-15-169-10.us-east-2.compute.amazonaws.com:jrockower`
    * From `/home/hadoop/jrockower`, use `sh ./get_imdb.sh`
      * Uses `curl` to put the gz files on hdfs. Then, `gunzip` and save to S3.
    * Saves files to `s3://jrockower-mpcs53014`

# Step 2 - Get Tables into Hive
* `beeline -u jdbc:hive2://localhost:10000/default -n hadoop -d org.apache.hive.jdbc.HiveDriver`
* Create box office tables:
    * [create_box_office.hql](./create_box_office.hql)
      * Uses CSV serde to create temporary tables and then saves these to Hive-managed tables.
    * jrockower_weekly_box_office
    * jrockower_lifetime_box_office
* Create IMDb tables:
    * [create_imdb_tables.hql](./create_imdb_tables.hql)
      * Uses CSV serde to save these tables in S3
    * jrockower_name_basics
    * jrockower_title_basics
    * jrockower_title_crew
    * jrockower_title_ratings

# Step 3 - Build Views using Spark
* `spark-shell`
* Run [create_views.scala](./create_views.scala) to build the two main views:
1. `jrockower_box_office_combined`
   * Data are at the year/week/rank level.
     * An individual row tells you, for a particular year and week, what the x number movie was at the box office.
2. `jrockower_film_keys`
   * A mapping from the name of a film (using both title and year) to the opening weekend for that film. Will be used to map user input to rows from `jrockower_box_office_combined`.
3. `jrockower_ratings`
   * A mapping from the name of a film (using both title and year, as in the keys) to the number of votes and total IMDb score (number of votes multiplied by the average rating).
   * This will be used as a lookup from the user input to get the calculated average rating (total score / number of votes).
   * This is separated out for the speed layer.
     * In the speed layer, as outlined below, a user can input their own review of a film.
     * The speed layer will increment this table. The total score increments by their rating and the number of votes increments by 1.

# Step 4 - Save Views to HBase
* `hbase shell`
* `create 'jrockower_film_keys_hbase', 'titles'`
* `create 'jrockower_box_office_hbase', 'films'`
* `create 'jrockower_ratings_hbase', 'ratings'`

* `beeline -u jdbc:hive2://localhost:10000/default -n hadoop -d org.apache.hive.jdbc.HiveDriver`
* Run [create_hbase.hql](./create_hbase.hql) to save these views to HBase.
  * For `jrockower_box_office_hbase`, setting the key to a concatenated field of year/week/rank + 1000000. Because HBase sorts lexicographically, by making every rank the same number of digits, this allows a proper sort.
  * Setting total score and number of votes as binary to be incremented as part of the speed layer.

* If need to recreate:
hive:
drop table jrockower_film_keys_hbase;
drop table jrockower_box_office_hbase;
drop table jrockower_ratings_hbase;

hbase shell
disable 'jrockower_film_keys_hbase'
drop 'jrockower_film_keys_hbase'
disable 'jrockower_box_office_hbase'
drop 'jrockower_box_office_hbase'
disable 'jrockower_ratings_hbase'
drop 'jrockower_ratings_hbase'

# Step 5 - Application
* As stated at top, the application creates a page at `/films-request.html` to request a film for which one would like to view box office data.
* app.js uses various mustache files to generate the request page and the output page.
* To get information for the cells, the application pulls information from all three HBase views as listed above.
  * Film names for the request form are taken from `jrockower_film_keys_hbase` which maps the name to the opening week of a film.
  * After selecting the film name, information on the top 10 films for the opening week associated with the selected film are acquired from `jrockower_box_office_hbase` and `jrockower_ratings_hbase`.
* `/films-review.html` creates a form in which one can enter a review of a film to increment the score and number of votes fields in `jrockower_ratings_hbase`.

# Step 6 - Speed Layer
* Created a Kafka topic called `jrockower_film_ratings` using:
  * `./kafka-topics.sh --create --zookeeper z-2.mpcs53014-kafka.fwx2ly.c4.kafka.us-east-2.amazonaws.com:2181,z-3.mpcs53014-kafka.fwx2ly.c4.kafka.us-east-2.amazonaws.com:2181,z-1.mpcs53014-kafka.fwx2ly.c4.kafka.us-east-2.amazonaws.com:2181 --replication-factor 1 --partitions 1 --topic jrockower-film-ratings`
* The application sends any reviews from the `films-review.html` page to the Kafka message queue.
* Code for the scala job to process the message queue is saved in [jrockower-speed](./jrockower-speed).
  * Reads in the message queue and increments the `jrockower_ratings_hbase` number of votes and total score fields.
  * Then, as the application runs and one requests the box office information for a film, the most up to date average score is displayed.
* To run the spark job:
  * `spark-submit --master local[2] --driver-javaptions "-Dlog4j.configuration=file:///home/hadoop/ss.log4j.properties" --class StreamReviews uber-jrockower-speed-1.0-SNAPSHOT.jar b-1.mpcs53014-kafka.fwx2ly.c4.kafka.us-east-2.amazonaws.com:9092,b-2.mpcs53014-kafka.fwx2ly.c4.kafka.us-east-2.amazonaws.com:9092`
