CREATE TEMPORARY TABLE jrockower_lt_box_office (rank SMALLINT, filmid STRING, title STRING, lifetimegross STRING, year BIGINT)
ROW FORMAT SERDE 'org.apache.hadoop.hive.serde2.OpenCSVSerde'
WITH SERDEPROPERTIES (
   "separatorChar" = ",",
   "quoteChar"     = "\""
)
STORED AS TEXTFILE
    location 's3://jrockower-mpcs53014/lifetime_box_office/';

CREATE TABLE jrockower_lifetime_box_office (rank SMALLINT, filmid STRING, title STRING, lifetimegross STRING, year BIGINT) stored as orc;

insert overwrite table jrockower_lifetime_box_office select rank, filmid, title, year, bigint(regexp_replace(substr(lifetimegross, 2, length(lifetimegross)), ',', '')) as lifetimegross
from jrockower_lt_box_office;

CREATE TEMPORARY TABLE jrockower_wk_box_office (rank SMALLINT, last_week STRING, filmid STRING, title STRING, gross STRING, change_lastweek STRING, theaters BIGINT, thtr_chg STRING, thtr_avg STRING, total_gross STRING, weeks SMALLINT, distributor STRING, yr_week STRING)
ROW FORMAT SERDE 'org.apache.hadoop.hive.serde2.OpenCSVSerde'
WITH SERDEPROPERTIES (
   "separatorChar" = ",",
   "quoteChar"     = "\""
)
STORED AS TEXTFILE
    location 's3://jrockower-mpcs53014/weekly_box_office';

CREATE TABLE jrockower_weekly_box_office (rank SMALLINT, last_week STRING, filmid STRING, title STRING, gross STRING, change_lastweek STRING, theaters BIGINT, thtr_chg STRING, thtr_avg STRING, total_gross STRING, weeks SMALLINT, distributor STRING, yr_week STRING) stored as orc;

insert overwrite table jrockower_weekly_box_office select rank, last_week, filmid, title, bigint(regexp_replace(substr(gross, 2, length(gross)), ',', '')) as gross, change_lastweek, theaters, thtr_chg,
bigint(regexp_replace(substr(thtr_avg, 2, length(thtr_avg)), ',', '')) as thtr_avg,
bigint(regexp_replace(substr(total_gross, 2, length(total_gross)), ',', '')) as gross,
weeks, distributor, yr_week from jrockower_wk_box_office;




