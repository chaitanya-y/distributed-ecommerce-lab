import "dotenv/config";
import app from "./app.js";
import { connectPostgres } from "./config/db.js";
import { connectRabbitMQ } from "./config/rabbitmq.js";

const PORT = process.env.PORT || 4002;

async function startServer() {
  try {
    await connectPostgres();
    await connectRabbitMQ();


    app.listen(PORT, () => {
      console.log(`Order service running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start order service", error);
    process.exit(1);
  }
}

startServer();
