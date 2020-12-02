# MPCS-53014
Big Data Application Architecture Final Project

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
    * From `/home/hadoop/jrockower`, use `sh get_imdb.sh`
    * Saves files to `s3://jrockower-mpcs53014`
