import org.apache.kafka.common.serialization.StringDeserializer
import org.apache.spark.SparkConf
import org.apache.spark.streaming._
import org.apache.spark.streaming.kafka010.ConsumerStrategies.Subscribe
import org.apache.spark.streaming.kafka010.LocationStrategies.PreferConsistent
import org.apache.spark.streaming.kafka010._
import com.fasterxml.jackson.databind.{ DeserializationFeature, ObjectMapper }
import com.fasterxml.jackson.module.scala.DefaultScalaModule
import org.apache.hadoop.conf.Configuration
import org.apache.hadoop.hbase.TableName
import org.apache.hadoop.hbase.HBaseConfiguration
import org.apache.hadoop.hbase.client.ConnectionFactory
import org.apache.hadoop.hbase.client.Get
import org.apache.hadoop.hbase.client.Increment
import org.apache.hadoop.hbase.util.Bytes

object StreamReviews {
  val mapper = new ObjectMapper()
  mapper.registerModule(DefaultScalaModule)
  val hbaseConf: Configuration = HBaseConfiguration.create()
  hbaseConf.set("hbase.zookeeper.property.clientPort", "2181")
  hbaseConf.set("hbase.zookeeper.quorum", "localhost")

  val hbaseConnection = ConnectionFactory.createConnection(hbaseConf)
  val table = hbaseConnection.getTable(TableName.valueOf("jrockower_ratings_hbase"))

  def getLatestScores(film: String) = {
    val result = table.get(new Get(Bytes.toBytes(film)))
    System.out.println(result.isEmpty())
    if(result.isEmpty())
      None
    else
      Some(CurrentScore(
        film,
        Bytes.toLong(result.getValue(Bytes.toBytes("ratings"), Bytes.toBytes("total_score"))),
        Bytes.toLong(result.getValue(Bytes.toBytes("ratings"), Bytes.toBytes("num_votes")))))
  }

  def incrementScore(kfr : Review) : String = {
    val maybeLatestScore = getLatestScores(kfr.film)
    if(maybeLatestScore.isEmpty)
      return "No current score for " + kfr.film;
    val latestScore = maybeLatestScore.get
    val inc = new Increment(Bytes.toBytes(kfr.film))

    inc.addColumn(Bytes.toBytes("ratings"), Bytes.toBytes("total_score"), kfr.review)
    inc.addColumn(Bytes.toBytes("ratings"), Bytes.toBytes("num_votes"), 1)

    table.increment(inc)
    return "Updated speed layer for review for " + kfr.film
  }
  
  def main(args: Array[String]) {
    if (args.length < 1) {
      System.err.println(s"""
        |Usage: StreamReviews <brokers>
        |  <brokers> is a list of one or more Kafka brokers
        | 
        """.stripMargin)
      System.exit(1)
    }

    val Array(brokers) = args

    // Create context with 2 second batch interval
    val sparkConf = new SparkConf().setAppName("StreamReviews")
    val ssc = new StreamingContext(sparkConf, Seconds(2))

    // Create direct kafka stream with brokers and topics
    val topicsSet = Set("jrockower-film-ratings")
    // Create direct kafka stream with brokers and topics
    val kafkaParams = Map[String, Object](
      "bootstrap.servers" -> brokers,
      "key.deserializer" -> classOf[StringDeserializer],
      "value.deserializer" -> classOf[StringDeserializer],
      "group.id" -> "use_a_separate_group_id_for_each_stream",
      "auto.offset.reset" -> "latest",
      "enable.auto.commit" -> (false: java.lang.Boolean)
    )
    val stream = KafkaUtils.createDirectStream[String, String](
      ssc, PreferConsistent,
      Subscribe[String, String](topicsSet, kafkaParams)
    )

    // Get the lines, split them into words, count the words and print
    val serializedRecords = stream.map(_.value);
    val reports = serializedRecords.map(rec => mapper.readValue(rec, classOf[Review]))

    // How to write to an HBase table

    val processedReviews = reports.map(incrementScore)
    processedReviews.print()
    
    // Start the computation
    ssc.start()
    ssc.awaitTermination()
  }

}
