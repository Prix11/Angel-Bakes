const fs = require("fs").promises;
const path = require("path");

const ORDERS_FILE = path.join(process.cwd(), "data", "orders.json");
const KV_KEY = "angel-bakes-orders";

function cleanEnv(value) {
  if (!value) return "";
  return String(value).trim().replace(/^["']|["']$/g, "");
}

function getKvEnv() {
  const url = cleanEnv(
    process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
  );
  const token = cleanEnv(
    process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
  );
  return { url, token };
}

function useKv() {
  const { url, token } = getKvEnv();
  return Boolean(url && token);
}

let redisClient = null;

function getRedis() {
  if (redisClient) return redisClient;

  const { url, token } = getKvEnv();
  if (!url || !token) {
    throw new Error("Set KV_REST_API_URL and KV_REST_API_TOKEN on Render");
  }

  const { Redis } = require("@upstash/redis");
  redisClient = new Redis({ url, token });
  return redisClient;
}

async function readOrders() {
  if (useKv()) {
    try {
      const redis = getRedis();
      const orders = await redis.get(KV_KEY);
      return Array.isArray(orders) ? orders : [];
    } catch (err) {
      console.error("Upstash readOrders failed:", err.message);
      throw new Error(
        "Could not connect to order database. Check Upstash REST URL and token on Render."
      );
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
      const redis = getRedis();
      await redis.set(KV_KEY, orders);
      return;
    } catch (err) {
      console.error("Upstash writeOrders failed:", err.message);
      throw new Error(
        "Could not save to order database. Check Upstash REST URL and token on Render."
      );
    }
  }

  await fs.mkdir(path.dirname(ORDERS_FILE), { recursive: true });
  await fs.writeFile(ORDERS_FILE, JSON.stringify(orders, null, 2), "utf8");
}

module.exports = { readOrders, writeOrders, useKv };
