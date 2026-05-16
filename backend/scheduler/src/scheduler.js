import "dotenv/config";
import cron from "node-cron";
import pg from "pg";
import amqp from "amqplib";

const { Pool } = pg;

const EXCHANGE_NAME = "order_events";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

let channel;

async function connectRabbitMQ() {
  const connection = await amqp.connect(process.env.RABBITMQ_URL);
  channel = await connection.createChannel();

  await channel.assertExchange(EXCHANGE_NAME, "topic", {
    durable: true,
  });

  console.log("Scheduler connected to RabbitMQ");
}

function publishOrderExpired(order) {
  const event = {
    eventType: "order.expired",
    occurredAt: new Date().toISOString(),
    data: {
      orderId: order.id,
      customerEmail: order.customer_email,
    },
  };

  channel.publish(
    EXCHANGE_NAME,
    "order.expired",
    Buffer.from(JSON.stringify(event)),
    {
      persistent: true,
      contentType: "application/json",
    }
  );
}

async function expirePendingOrders() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      `
      UPDATE orders
      SET status = 'EXPIRED',
          updated_at = NOW()
      WHERE status = 'PENDING'
        AND created_at < NOW() - INTERVAL '2 minutes'
      RETURNING *
      `
    );

    await client.query("COMMIT");

    for (const order of result.rows) {
      publishOrderExpired(order);
    }

    if (result.rows.length > 0) {
      console.log(`Expired ${result.rows.length} pending order(s)`);
    }
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Failed to expire pending orders", error);
  } finally {
    client.release();
  }
}

async function startScheduler() {
  await pool.query("SELECT 1");
  console.log("Scheduler connected to PostgreSQL");

  await connectRabbitMQ();

  cron.schedule("* * * * *", async () => {
    console.log("Running pending order expiry job");
    await expirePendingOrders();
  });

  console.log("Scheduler started");
}

startScheduler().catch((error) => {
  console.error("Scheduler failed to start", error);
  process.exit(1);
});
