README

hive:
drop table jrockower_film_keys_hbase;
drop table jrockower_box_office_hbase;

hbase shell
disable 'jrockower_film_keys_hbase'
drop 'jrockower_film_keys_hbase'

create table 'jrockower_film_keys_hbase', 'titles'