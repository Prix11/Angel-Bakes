const fs = require("fs").promises;
const path = require("path");

const ORDERS_FILE = path.join(process.cwd(), "data", "orders.json");
const KV_KEY = "angel-bakes-orders";

function getKvClient() {
  const { createClient } = require("@vercel/kv");

  const url =
    process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    return createClient({ url, token });
  }

  return require("@vercel/kv").kv;
}

function getKvEnv() {
  const url =
    process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return { url, token };
}

function useKv() {
  const { url, token } = getKvEnv();
  return Boolean(url && token);
}

async function readOrders() {
  if (useKv()) {
    const { url, token } = getKvEnv();
    if (!url || !token) {
      throw new Error("Database not configured: set KV_REST_API_URL and KV_REST_API_TOKEN on Render");
    }
    try {
      const kv = getKvClient();
      const orders = await kv.get(KV_KEY);
      return Array.isArray(orders) ? orders : [];
    } catch (err) {
      console.error("KV readOrders failed:", err.message);
      throw new Error("Could not connect to order database. Check Upstash keys on Render.");
    }
  }

  try {
    const raw = await fs.readFile(ORDERS_FILE, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
}

async function writeOrders(orders) {
  if (useKv()) {
    try {
      const kv = getKvClient();
      await kv.set(KV_KEY, orders);
      return;
    } catch (err) {
      console.error("KV writeOrders failed:", err.message);
      throw new Error("Could not save to order database. Check Upstash keys on Render.");
    }
  }

  await fs.mkdir(path.dirname(ORDERS_FILE), { recursive: true });
  await fs.writeFile(ORDERS_FILE, JSON.stringify(orders, null, 2), "utf8");
}

module.exports = { readOrders, writeOrders, useKv };
