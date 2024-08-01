import { Hono } from "hono";

const app = new Hono();

// Middleware to handle all requests
app.use("*", async (c) => {
  const body = await c.req.json();

  console.log("Received request: ", body);
  return c.json({
    message: `Received from logger: ${JSON.stringify(body)}`,
  });
});

export default {
  port: 3000,
  fetch: app.fetch,
};
