import { createClient } from "redis";

export const redisClient = createClient({
  url: process.env.REDIS_URL,
});

redisClient.on("error", (error) => {
  console.error("Redis error", error);
});

export async function connectRedis() {
  if (!process.env.REDIS_URL) {
    throw new Error("REDIS_URL is missing");
  }

  await redisClient.connect();

  console.log("Connected to Redis");
}
