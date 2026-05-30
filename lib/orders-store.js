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

function useKv() {
  return Boolean(
    process.env.KV_REST_API_URL ||
      process.env.KV_REST_API_TOKEN ||
      process.env.UPSTASH_REDIS_REST_URL ||
      process.env.UPSTASH_REDIS_REST_TOKEN ||
      process.env.KV_URL
  );
}

async function readOrders() {
  if (useKv()) {
    const kv = getKvClient();
    const orders = await kv.get(KV_KEY);
    return Array.isArray(orders) ? orders : [];
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
    const kv = getKvClient();
    await kv.set(KV_KEY, orders);
    return;
  }

  await fs.mkdir(path.dirname(ORDERS_FILE), { recursive: true });
  await fs.writeFile(ORDERS_FILE, JSON.stringify(orders, null, 2), "utf8");
}

module.exports = { readOrders, writeOrders, useKv };
