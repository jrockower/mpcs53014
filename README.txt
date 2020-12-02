README

hive:
drop table jrockower_film_keys_hbase;
drop table jrockower_box_office_hbase;

hbase shell
disable 'jrockower_film_keys_hbase'
drop 'jrockower_film_keys_hbase'

create table 'jrockower_film_keys_hbase', 'titles'



Speed layer:
Increment adding imdb vote
Add additional rating and change the number reviewed
Maybe add like 100 at a time to actually see a result

Can do same with per-screen average

To do:
fix html on landing page to state the purpose and how to use it
