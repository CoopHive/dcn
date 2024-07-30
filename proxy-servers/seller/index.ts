import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { Kysely, PostgresDialect } from "kysely";
import { type DB } from "kysely-codegen";
import { Pool } from "pg";
import { createPublicClient, http, recoverMessageAddress } from "viem";
import { anvil } from "viem/chains";

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

const app = express();

// The target URL where we want to forward requests
const TARGET_URL = "http://localhost:3000";

function isHex(s: unknown): asserts s is `0x${string}` {
  if (typeof s !== "string" || !s.startsWith("0x")) {
    throw new Error("Expected hex string");
  }
}

const proxyMiddleware = createProxyMiddleware({
  target: TARGET_URL,
  changeOrigin: true,
  on: {
    proxyReq: async (proxyReq, req) => {
      console.log("req received");
      const signature = req.headers["x-hive-signature"];
      const nonce = req.headers["x-hive-nonce"];

      try {
        isHex(signature);
      } catch (e) {
        console.error("Invalid signature: ", signature, e);
        return;
      }
      if (typeof nonce !== "string") {
        console.error("Invalid nonce: ", nonce);
        return;
      }

      const address = await recoverMessageAddress({
        message: nonce,
        signature,
      });
      console.log("Recovered address: ", address);

      if (!isAuthorized(address)) {
        console.error("Unauthorized address: ", address);
        return;
      }

      proxyReq.removeHeader("x-hive-signature");
      proxyReq.removeHeader("x-hive-nonce");
    },
  },
});

const isAuthorized = async (address: string): Promise<boolean> => {
  try {
    const credits =
      (
        await db
          .selectFrom("credits")
          .select("credits")
          .where("public_key", "=", address)
          .executeTakeFirst()
      )?.credits ?? 0;

    if (credits > 0) {
      await db
        .updateTable("credits")
        .set((eb) => ({ credits: eb("credits", "-", 1) }))
        .where("public_key", "=", address)
        .executeTakeFirst();

      return true;
    }
  } finally {
    return false;
  }
};

app.use(proxyMiddleware);
app.listen(3200);
