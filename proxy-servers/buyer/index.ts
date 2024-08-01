import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { v4 as uuidv4 } from "uuid";
import {
  createWalletClient,
  encodeAbiParameters,
  http,
  parseAbiParameters,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { anvil } from "viem/chains";

declare global {
  namespace Express {
    interface Request {
      signature: string;
      timestamp: bigint;
      timeout: bigint;
      nonce: string;
    }
  }
}

function startProxyServer(settings: {
  targetUrl: string;
  port: number;
  pKey: `0x${string}`;
  timeout: number;
}) {
  const account = privateKeyToAccount(settings.pKey);
  const walletClient = createWalletClient({
    account,
    chain: anvil,
    transport: http(),
  });

  const app = express();
  const proxyMiddleware = createProxyMiddleware({
    target: settings.targetUrl,
    changeOrigin: true,
    on: {
      proxyReq: (proxyReq, req: express.Request) => {
        proxyReq.setHeader("x-hive-signature", req.signature);
        proxyReq.setHeader("x-hive-timestamp", req.timestamp);
        proxyReq.setHeader("x-hive-timeout", req.timeout);
        proxyReq.setHeader("x-hive-nonce", req.nonce);
      },
    },
  });

  app.use(async (req, res, next) => {
    req.timestamp = BigInt(Date.now());
    req.timeout = BigInt(settings.timeout);
    req.nonce = uuidv4();

    req.signature = await walletClient.signMessage({
      account,
      message: encodeAbiParameters(
        parseAbiParameters("uint timestamp, uint timeout, string uuid"),
        [req.timestamp, req.timeout, req.nonce]
      ),
    });
    next();
  }, proxyMiddleware);
  app.listen(settings.port);
}

startProxyServer({
  targetUrl: "http://localhost:3200",
  port: 3100,
  pKey: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
  timeout: 1000,
});
