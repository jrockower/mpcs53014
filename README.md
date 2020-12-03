# Big Data Application Architecture Final Project

# Purpose
The idea for this project came from the [Blank Check Podcast with Griffin and David](https://soundcloud.com/griffin-and-david-present). At the end of each week of the podcast, they play the "Box Office Game" in which Griffin must guess the top 5 movies at the box office in the week in which the movie they're discussing originally came out. Often while bringing up [Box Office Mojo](boxofficemojo.com), they mention that the site is challenging to navigate. I wanted to build a tool that could be used for a similar purpose, with a simple user input.

To make the scraping process shorter for the limited purpose of this project, I scraped the top 10 of every weekend in the Box Office Mojo database. I also have determined the "opening weekend" to be the first weekend in which a film was in the *top 10 at the box office*. This avoids any kind of complication related to movies that start in limited release and then expand later. However, it also limits the analysis to any movies that were *ever* in the top 10 at the box office and could include movies that started lower and then moved into the top 10.

# How to Use
* The user is first asked to think of a film for which they are interested in seeing opening weekend box office information.
* From `/films-request.html` a user enters the name of a film using the dropdown menu.
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

# Step 4 - Save Views to HBase
* `hbase shell`
* `create 'jrockower_film_keys_hbase', 'titles'`
* `create 'jrockower_box_office_hbase', 'films'`

* `beeline -u jdbc:hive2://localhost:10000/default -n hadoop -d org.apache.hive.jdbc.HiveDriver`
* Run [create_hbase.hql](./create_hbase.hql) to save these views to HBase.
  * For `jrockower_box_office_hbase`, setting the key to a concatenated field of year/week/rank + 1000000. Because HBase sorts lexicographically, by making every rank the same number of digits, this allows a proper sort.

* If need to recreate:
hive:
drop table jrockower_film_keys_hbase;
drop table jrockower_box_office_hbase;

hbase shell
disable 'jrockower_film_keys_hbase'
drop 'jrockower_film_keys_hbase'
disable 'jrockower_box_office_hbase'
drop 'jrockower_box_office_hbase'

# Step 5 - Application

# Speed Layer

Kafka:
./kafka-topics.sh --create --zookeeper z-2.mpcs53014-kafka.fwx2ly.c4.kafka.us-east-2.amazonaws.com:2181,z-3.mpcs53014-kafka.fwx2ly.c4.kafka.us-east-2.amazonaws.com:2181,z-1.mpcs53014-kafka.fwx2ly.c4.kafka.us-east-2.amazonaws.com:2181 --replication-factor 1 --partitions 1 --topic jrockower-film-ratings

Speed layer:
Need to create table that maps films to average rating and number of votes
then, pull out of the main table
then, select these in the javascript
then, learn how to increment



Increment adding imdb vote
Add additional rating and change the number reviewed
Maybe add like 100 at a time to actually see a result

Can do same with per-screen average

To do:
fix html on landing page to state the purpose and how to use it


spark-submit --master local[2] --driver-java-options "-Dlog4j.configuration=file:///home/hadoop/ss.log4j.properties" --class StreamReviews uber-jrockower-speed-1.0-SNAPSHOT.jar b-1.mpcs53014-kafka.fwx2ly.c4.kafka.us-east-2.amazonaws.com:9092,b-2.mpcs53014-kafka.fwx2ly.c4.kafka.us-east-2.amazonaws.com:9092
