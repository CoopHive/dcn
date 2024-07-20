const { Kafka } = require("kafkajs");

const kafka = new Kafka({
  clientId: "resource-provider",
  brokers: ["localhost:9092"],
});

const producer = kafka.producer();

const consumer = kafka.consumer({ groupId: "test-group" });

await consumer.connect();
await consumer.subscribe({ topic: "buy-credits", fromBeginning: false });

await consumer.run({
  eachMessage: async ({ topic, partition, message }) => {
    console.log({
      value: message.value.toString(),
    });
  },
});
