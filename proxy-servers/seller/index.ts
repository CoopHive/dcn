import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { Kysely, PostgresDialect } from "kysely";
import { type DB } from "kysely-codegen";
import { Pool } from "pg";
import {
  encodeAbiParameters,
  parseAbiParameters,
  recoverMessageAddress,
} from "viem";

// auth function; edit as needed
const sampleIsAuthorized = async (
  address: string,
  db: Kysely<DB>
): Promise<boolean> => {
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
        .executeTakeFirstOrThrow();

      return true;
    }
  } finally {
    return false;
  }
};

// utils
function isString(s: unknown): asserts s is string {
  if (typeof s !== "string") {
    throw new Error(`${s} is not a string`);
  }
}

function isHex(s: unknown): asserts s is `0x${string}` {
  isString(s);
  if (!s.startsWith("0x")) {
    throw new Error(`${s} is not a hex string`);
  }
}

function isUintString(s: unknown): asserts s is string {
  isString(s);
  if (!/^\d+$/.test(s)) {
    throw new Error(`${s} is not a uint string`);
  }
}

// main
function startProxyServer(settings: {
  creditsDb: {
    name: string;
    host: string;
  };
  targetUrl: string;
  port: number;
  isAuthorized: (address: string, db: Kysely<DB>) => Promise<boolean>;
}) {
  const db = new Kysely<DB>({
    dialect: new PostgresDialect({
      pool: new Pool({
        database: "dvd_credits",
        host: "localhost",
      }),
    }),
  });

  const proxyMiddleware = createProxyMiddleware({
    target: settings.targetUrl,
    changeOrigin: true,
    on: {
      proxyReq: (proxyReq) => {
        proxyReq.removeHeader("x-hive-signature");
        proxyReq.removeHeader("x-hive-timestamp");
        proxyReq.removeHeader("x-hive-timeout");
        proxyReq.removeHeader("x-hive-nonce");
      },
    },
  });

  const app = express();

  app.use(async (req, res, next) => {
    console.log("req received");
    const signature = req.headers["x-hive-signature"];
    const timestampRaw = req.headers["x-hive-timestamp"];
    const timeoutRaw = req.headers["x-hive-timeout"];
    const nonce = req.headers["x-hive-nonce"];

    try {
      isHex(signature);
      isUintString(timestampRaw);
      isUintString(timeoutRaw);
      isString(nonce);
    } catch (e) {
      console.error("Invalid signature or nonce: ", e);
      return;
    }

    const timestamp = parseInt(timestampRaw);
    const timeout = parseInt(timeoutRaw);

    if (Date.now() - timestamp > timeout) {
      console.error("Request timeout");
      return;
    }

    const address = await recoverMessageAddress({
      message: encodeAbiParameters(
        parseAbiParameters("uint timestamp, uint timeout, string uuid"),
        [BigInt(timestamp), BigInt(timeout), nonce]
      ),
      signature,
    });
    console.log("Recovered address: ", address);

    if (!settings.isAuthorized(address, db)) {
      console.error("Unauthorized address: ", address);
      return;
    }
    next();
  }, proxyMiddleware);
  app.listen(settings.port);
}

startProxyServer({
  creditsDb: {
    name: "dvd_credits",
    host: "localhost",
  },
  targetUrl: "http://localhost:3000",
  port: 3200,
  isAuthorized: sampleIsAuthorized,
});
