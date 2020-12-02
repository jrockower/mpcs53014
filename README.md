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
    * Saves files to `s3://jrockower-mpcs53014`
