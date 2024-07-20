import { Kysely, PostgresDialect } from "kysely";
import { type DB } from "kysely-codegen";
import { Pool } from "pg";
import { createPublicClient, http } from "viem";
import { anvil } from "viem/chains";

const { Kafka } = require("kafkajs");

const kafka = new Kafka({
  clientId: "resource-provider",
  brokers: ["localhost:9092"],
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: "resource-provider" });

const client = createPublicClient({
  chain: anvil,
  transport: http(),
});

const db = new Kysely<DB>({
  dialect: new PostgresDialect({
    pool: new Pool({
      database: "dvd_credits",
      host: "localhost",
    }),
  }),
});

await consumer.connect();
await consumer.subscribe({ topic: "buy-credits", fromBeginning: false });

await consumer.run({
  eachMessage: async ({ topic, partition, message }) => {
    // listen for request-credits message
    // respond with ok-request message
    // listen for bid-submitted message
    // claim collateral from on-chain (listen for validation event on-chain first)
    // submit ask on-chain & register credits in db
    // reply with ask-submitted message

    console.log({
      value: message.value.toString(),
    });
  },
});
