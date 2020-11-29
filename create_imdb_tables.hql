drop table jrockower_name_basics;
drop table jrockower_title_basics;
drop table jrockower_title_crew;
drop table jrockower_title_ratings;

CREATE EXTERNAL TABLE jrockower_name_basics (id STRING, name STRING, birthyear STRING, deathyear STRING, profession STRING, knownfor STRING)
ROW FORMAT SERDE 'org.apache.hadoop.hive.serde2.OpenCSVSerde'
WITH SERDEPROPERTIES (
   "separatorChar" = "\t",
   "quoteChar"     = "\""
)
STORED AS TEXTFILE
    location 's3://jrockower-mpcs53014/name_basics'
tblproperties("skip.header.line.count"="1");

CREATE EXTERNAL TABLE jrockower_title_basics (filmid STRING, titletype STRING, primarytitle STRING, originaltitle STRING, adult BOOLEAN, startyear SMALLINT, endyear STRING, runtime_min BIGINT, genres STRING)
ROW FORMAT SERDE 'org.apache.hadoop.hive.serde2.OpenCSVSerde'
WITH SERDEPROPERTIES (
   "separatorChar" = "\t",
   "quoteChar"     = "\""
)
STORED AS TEXTFILE
    location 's3://jrockower-mpcs53014/title_basics'
tblproperties("skip.header.line.count"="1");

CREATE EXTERNAL TABLE jrockower_title_crew (filmid STRING, directors STRING, writers STRING)
ROW FORMAT SERDE 'org.apache.hadoop.hive.serde2.OpenCSVSerde'
WITH SERDEPROPERTIES (
   "separatorChar" = "\t",
   "quoteChar"     = "\""
)
STORED AS TEXTFILE
    location 's3://jrockower-mpcs53014/title_crew'
tblproperties("skip.header.line.count"="1");

CREATE EXTERNAL TABLE jrockower_title_ratings (filmid STRING, avg_rating FLOAT, num_votes BIGINT)
ROW FORMAT SERDE 'org.apache.hadoop.hive.serde2.OpenCSVSerde'
WITH SERDEPROPERTIES (
   "separatorChar" = "\t",
   "quoteChar"     = "\""
)
STORED AS TEXTFILE
    location 's3://jrockower-mpcs53014/title_ratings'
tblproperties("skip.header.line.count"="1");


