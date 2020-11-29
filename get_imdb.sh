#!/bin/bash

curl https://datasets.imdbws.com/name.basics.tsv.gz | hdfs dfs -put - /tmp/jrockower/project/zipped/name_basics.tsv.gz
hdfs dfs -cat /tmp/jrockower/project/zipped/name_basics.tsv.gz | gunzip | aws s3 cp - s3://jrockower-mpcs53014/name_basics/name_basics.tsv

curl https://datasets.imdbws.com/title.basics.tsv.gz | hdfs dfs -put - /tmp/jrockower/project/zipped/title_basics.tsv.gz
hdfs dfs -cat /tmp/jrockower/project/zipped/title_basics.tsv.gz | gunzip | aws s3 cp - s3://jrockower-mpcs53014/title_basics/title_basics.tsv

curl https://datasets.imdbws.com/title.crew.tsv.gz | hdfs dfs -put - /tmp/jrockower/project/zipped/title_crew.tsv.gz
hdfs dfs -cat /tmp/jrockower/project/zipped/title_crew.tsv.gz | gunzip | aws s3 cp - s3://jrockower-mpcs53014/title_crew/title_crew.tsv

curl https://datasets.imdbws.com/title.ratings.tsv.gz | hdfs dfs -put - /tmp/jrockower/project/zipped/title_ratings.tsv.gz
hdfs dfs -cat /tmp/jrockower/project/zipped/title_ratings.tsv.gz | gunzip | aws s3 cp - s3://jrockower-mpcs53014/title_ratings/title_ratings.tsv