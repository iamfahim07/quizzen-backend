import dotenv from "dotenv";
import { createClient } from "redis";

// config env file
dotenv.config();

// Helper TTL constant (in seconds)
const TTL_SECONDS = 30 * 60; // 30 minutes

const redisClient = createClient({
  url: process.env.REDIS_URL,
});

redisClient.on("error", (err) => console.error("Redis Client Error", err));

// (async () => {
//   await redisClient.connect();
//   console.log("✅ Connected to Redis");
// })();

async function connectRedis() {
  if (!redisClient.isOpen) {
    await redisClient.connect();
    console.log("✅ Connected to Redis");
  }
}

// NX: true → create the key only if it doesn't already exist
async function setWithExpire(key, value, ex = TTL_SECONDS) {
  await connectRedis();
  return redisClient.set(key, JSON.stringify(value), {
    EX: ex,
    // NX: true,
  });
}

async function getWithTTL(key) {
  await connectRedis();
  const raw = await redisClient.get(key);
  if (raw === null) return null;

  let value;
  try {
    value = JSON.parse(raw);
  } catch {
    value = raw;
  }

  const ttl = await redisClient.ttl(key);
  return { value, ttl };
}

export { getWithTTL, setWithExpire };

// export default redisClient;
