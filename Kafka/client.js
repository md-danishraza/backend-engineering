const { Kafka } = require("kafkajs");

// Initializing the Kafka client
exports.kafka = new Kafka({
  clientId: "my-rider-app",
  brokers: ["localhost:9092"], // The address of  Kafka broker
});
