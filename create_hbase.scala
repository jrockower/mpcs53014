val crew = spark.sql("""select filmid, split(directors, ',')[0] as dir1, split(directors, ',')[1] as dir2, split(directors, ',')[2] as dir3, split(writers, ',')[0] as writer1, split(writers, ',')[1] as writer2, split(writers, ',')[2] as writer3 from jrockower_title_crew where directors != 'directors'""")

val titles = spark.sql("""select a.filmid, a.titletype, a.primarytitle, a.startyear, a.runtime_min, a.genres, b.avg_rating, b.num_votes from jrockower_title_basics a left join jrockower_title_ratings b on a.filmid = b.filmid where a.filmid != 'tconst' and b.filmid != 'tconst' and a.adult != 1""")

crew.createOrReplaceTempView("crew")
titles.createOrReplaceTempView("titles")

val dir1 = spark.sql("""select a.*, b.name as director1 from crew a left join jrockower_name_basics b on a.dir1 = b.id""")
dir1.createOrReplaceTempView("dir1")

val dir2 = spark.sql("""select a.*, b.name as director2 from dir1 a left join jrockower_name_basics b on a.dir2 = b.id""")
dir2.createOrReplaceTempView("dir2")

val dir3 = spark.sql("""select a.*, b.name as director3 from dir2 a left join jrockower_name_basics b on a.dir3 = b.id""")
dir3.createOrReplaceTempView("dir3")

val writers1 = spark.sql("""select a.*, b.name as screenwriter1 from dir3 a left join jrockower_name_basics b on a.writer1 = b.id""")
writers1.createOrReplaceTempView("writers1")

val writers2 = spark.sql("""select a.*, b.name as screenwriter2 from writers1 a left join jrockower_name_basics b on a.writer2 = b.id""")
writers2.createOrReplaceTempView("writers2")

val writers3 = spark.sql("""select a.*, b.name as screenwriter3 from writers2 a left join jrockower_name_basics b on a.writer3 = b.id""")
writers3.createOrReplaceTempView("writers3")

val crew_info = spark.sql("""select filmid, director1, director2, director3, screenwriter1 as writer1, screenwriter2 as writer2, screenwriter3 as writer3 from writers3""")
crew_info.createOrReplaceTempView("crew_info")

val combined = spark.sql("""select a.*, b.director1, b.director2, b.director3, b.writer1, b.writer2, b.writer3 from titles a left join crew_info b on a.filmid = b.filmid""")
combined.createOrReplaceTempView("combined")

val weekly = spark.sql("""select * from jrockower_weekly_box_office""")

val lifetime = spark.sql("""select * from jrockower_lifetime_box_office""")
