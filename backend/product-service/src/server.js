import "dotenv/config";
import app from "./app.js";
import { connectMongoDB } from "./config/mongodb.js";
import { connectRedis } from "./config/redis.js";
import { connectElasticsearch } from "./config/elasticsearch.js";
const PORT = process.env.PORT || 4001;

async function startServer() {
  try {
    await connectMongoDB();
    await connectRedis();
    await connectElasticsearch();
    app.listen(PORT, () => {
      console.log(`Product service running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start product service", error);
    process.exit(1);
  }
}

startServer();
