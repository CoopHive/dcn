const { Kafka } = require("kafkajs");

const kafka = new Kafka({
  clientId: "buyer",
  brokers: ["localhost:9092"],
});
const producer = kafka.producer();

async function buyCredits() {
  await producer.connect();
  await producer.send({
    topic: "buy-credits",
    messages: [{ value: "Buy 200 credits" }],
  });
  await producer.disconnect();
}

await buyCredits();
