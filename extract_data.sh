#!/bin/bash

# python3 BoxOfficeMojo.py

ssh -i ~/.ssh/jrockower.pem hadoop@ec2-52-15-169-10.us-east-2.compute.amazonaws.com

curl -o - https://datasets.imdbws.com/name.basics.tsv.gz | gunzip > data/name_basics.tsv
curl -o - https://datasets.imdbws.com/title.akas.tsv.gz | gunzip > data/title_akas.tsv
curl -o - https://datasets.imdbws.com/title.basics.tsv.gz | gunzip > data/title_basics.tsv
curl -o - https://datasets.imdbws.com/title.crew.tsv.gz | gunzip > data/title_crew.tsv
curl -o - https://datasets.imdbws.com/title.ratings.tsv.gz | gunzip > data/title_ratings.tsv