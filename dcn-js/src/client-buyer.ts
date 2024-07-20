import { createPublicClient, http } from "viem";
import { anvil } from "viem/chains";

const { Kafka } = require("kafkajs");

const kafka = new Kafka({
  clientId: "buyer",
  brokers: ["localhost:9092"],
});
const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: "buyer" });

const client = createPublicClient({
  chain: anvil,
  transport: http(),
});

async function buyCredits() {
  await producer.connect();
  // send request-credits message
  await producer.send({
    topic: "buy-credits",
    messages: [{ value: "Buy 200 credits" }],
  });

  // listen for ok-request message
  // deposit collateral on-chain
  // send bid-submitted message
  // listen for ask-submitted message
  // check on-chain to confirm, reclaim collateral if invalid or non-existent

  await producer.disconnect();
}

await buyCredits();
