#!/bin/bash

python3 BoxOfficeMojo.py

ssh -i ~/.ssh/jrockower.pem hadoop@ec2-52-15-169-10.us-east-2.compute.amazonaws.com

curl https://datasets.imdbws.com/name.basics.tsv.gz | gunzip | hdfs dfs -put - /tmp/jrockower/project/name_basics.tsv
curl https://datasets.imdbws.com/title.akas.tsv.gz | gunzip | hdfs dfs -put - /tmp/jrockower/project/title_akas.tsv
curl https://datasets.imdbws.com/title.basics.tsv.gz | gunzip | hdfs dfs -put - /tmp/jrockower/project/title_basics.tsv
curl https://datasets.imdbws.com/title.crew.tsv.gz | gunzip | hdfs dfs -put - /tmp/jrockower/project/title_crew.tsv
curl https://datasets.imdbws.com/title.ratings.tsv.gz | gunzip | hdfs dfs -put - /tmp/jrockower/project/title_ratings.tsv