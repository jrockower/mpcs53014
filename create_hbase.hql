create external table jrockower_box_office_hbase (
  id string, rank bigint, last_week string, filmid string, title string,
  gross bigint, change_lastweek string, theaters bigint, thtr_chg string, thtr_avg bigint,
  total_gross bigint, weeks smallint, distributor string, yr_week string, lifetime_rank bigint,
  lifetime_gross bigint, startyear smallint, runtime_min bigint, genres string, avg_rating float,
  num_votes bigint, director1 string, director2 string, director3 string,
  writer1 string, writer2 string, writer3 string)
STORED BY 'org.apache.hadoop.hive.hbase.HBaseStorageHandler'
WITH SERDEPROPERTIES ('hbase.columns.mapping' = ':key, films:rank, films:last_week, films:filmid,
films:title, films:gross, films:change_lastweek, films:theaters, films:thtr_chg, films:thtr_avg,
films:total_gross, films:weeks, films:distributor, films:yr_week, films:lifetime_rank,
films:lifetime_gross, films:startyear, films:runtime_min, films:genres, films:avg_rating,
films:num_votes, films:director1, films:director2, films:director3, films:writer1,
films:writer2, films:writer3')
TBLPROPERTIES ('hbase.table.name' = 'jrockower_box_office_hbase');

insert overwrite table jrockower_box_office_hbase
select concat(yr_week, rank) as id, * from jrockower_box_office_combined;
