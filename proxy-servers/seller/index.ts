import { Kysely, PostgresDialect } from "kysely";
import { type DB } from "kysely-codegen";
import { Pool } from "pg";
import { createPublicClient, http } from "viem";
import { anvil } from "viem/chains";
import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

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
const TARGET_URL = "http://localhost:3200";

const proxyMiddleware = createProxyMiddleware({
  target: TARGET_URL,
  changeOrigin: true,
  on: {
    proxyReq: async (proxyReq) => {
      const hiveAuth = proxyReq.getHeader("X-Hive-Signature");
      console.log("Hive Signature: ", hiveAuth);
      proxyReq.removeHeader("X-Hive-Signature");
    },
  },
});

app.use("*", proxyMiddleware);

app.listen(3100);
