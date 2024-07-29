import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

const app = express();

// The target URL where we want to forward requests
const TARGET_URL = "http://localhost:3100";

const proxyMiddleware = createProxyMiddleware({
  target: TARGET_URL,
  changeOrigin: true,
  on: {
    proxyReq: (proxyReq) => {
      proxyReq.setHeader("X-Hive-Signature", "0x123");
    },
  },
});

app.use("*", proxyMiddleware);

app.listen(3000);
