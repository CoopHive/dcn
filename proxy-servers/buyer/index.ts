import express from "express";
import { createProxyMiddleware, fixRequestBody } from "http-proxy-middleware";
import {
  createWalletClient,
  encodeAbiParameters,
  http,
  parseAbiParameters,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { anvil } from "viem/chains";
import { v4 as uuidv4 } from "uuid";

declare global {
  namespace Express {
    interface Request {
      signature: string;
      nonce: string;
    }
  }
}

const app = express();

const account = privateKeyToAccount(
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
);
const walletClient = createWalletClient({
  account,
  chain: anvil,
  transport: http(),
});

// The target URL where we want to forward requests
const TARGET_URL = "http://localhost:3200";

const proxyMiddleware = createProxyMiddleware({
  target: TARGET_URL,
  changeOrigin: true,
  on: {
    proxyReq: (proxyReq, req: express.Request) => {
      proxyReq.setHeader("x-hive-signature", req.signature);
      proxyReq.setHeader("x-hive-nonce", req.nonce);
    },
  },
});

app.use(async (req, res, next) => {
  req.nonce = uuidv4();
  req.signature = await walletClient.signMessage({
    account,
    message: req.nonce,
  });
  next();
}, proxyMiddleware);
app.listen(3100);
