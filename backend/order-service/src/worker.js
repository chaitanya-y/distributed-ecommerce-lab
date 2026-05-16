import "dotenv/config";
import amqp from "amqplib";
import { pool, connectPostgres } from "./config/db.js";

const EXCHANGE_NAME = "order_events";
const QUEUE_NAME = "order_processor_order_created";
const ENABLE_WORKER_DELAY = true;
const WORKER_DELAY_MS = 5000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
async function publishEvent(channel, routingKey, eventType, data) {
  const event = {
    eventType,
    occurredAt: new Date().toISOString(),
    data,
  };

  channel.publish(
    EXCHANGE_NAME,
    routingKey,
    Buffer.from(JSON.stringify(event)),
    {
      persistent: true,
      contentType: "application/json",
    }
  );
}

async function reserveInventory(client, items) {
  for (const item of items) {
    const inventoryResult = await client.query(
      `
      SELECT *
      FROM inventory
      WHERE product_id = $1
      FOR UPDATE
      `,
      [item.product_id]
    );

    if (inventoryResult.rows.length === 0) {
      throw new Error(`Inventory not found for product ${item.product_id}`);
    }

    const inventory = inventoryResult.rows[0];
    const availableStock = inventory.stock - inventory.reserved;

    if (availableStock < item.quantity) {
      throw new Error(`Not enough stock for product ${item.product_id}`);
    }

    await client.query(
      `
      UPDATE inventory
      SET reserved = reserved + $1,
          updated_at = NOW()
      WHERE product_id = $2
      `,
      [item.quantity, item.product_id]
    );
  }
}


async function finalizeInventorySale(client, items) {
  for (const item of items) {
    await client.query(
      `
      UPDATE inventory
      SET stock = stock - $1,
          reserved = reserved - $1,
          updated_at = NOW()
      WHERE product_id = $2
      `,
      [item.quantity, item.product_id]
    );
  }
}


async function processPaymentIdempotently(client, order) {
  const idempotencyKey = `payment:${order.id}`;

  const existingPaymentResult = await client.query(
    `
    SELECT *
    FROM payment_attempts
    WHERE idempotency_key = $1
    `,
    [idempotencyKey]
  );

  if (existingPaymentResult.rows.length > 0) {
    return existingPaymentResult.rows[0];
  }

  const paymentResult = await client.query(
    `
    INSERT INTO payment_attempts (
      order_id,
      idempotency_key,
      status,
      amount
    )
    VALUES ($1, $2, $3, $4)
    RETURNING *
    `,
    [order.id, idempotencyKey, "SUCCEEDED", order.total_amount]
  );

  return paymentResult.rows[0];
}

async function processOrder(event, channel) {
  const client = await pool.connect();

  try {
    const { order, items } = event.data;

    await client.query("BEGIN");

    const currentOrderResult = await client.query(
      `
      SELECT *
      FROM orders
      WHERE id = $1
      FOR UPDATE
      `,
      [order.id]
    );

    if (currentOrderResult.rows.length === 0) {
      throw new Error(`Order ${order.id} not found`);
    }

    const currentOrder = currentOrderResult.rows[0];

    if (ENABLE_WORKER_DELAY) {
      console.log(`Demo delay: waiting ${WORKER_DELAY_MS}ms before processing order`);
      await sleep(WORKER_DELAY_MS);
    }

    if (currentOrder.status !== "PENDING") {
      await client.query("COMMIT");
      return;
    }

    await reserveInventory(client, items);
    const paymentAttempt = await processPaymentIdempotently(client, currentOrder);
    await finalizeInventorySale(client, items);


    await client.query(
      `
      UPDATE orders
      SET status = $1,
          updated_at = NOW()
      WHERE id = $2
      `,
      ["CONFIRMED", currentOrder.id]
    );

    await client.query("COMMIT");

    await publishEvent(channel, "order.confirmed", "order.confirmed", {
      orderId: currentOrder.id,
      customerEmail: currentOrder.customer_email,
      paymentAttemptId: paymentAttempt.id,
    });

    console.log(`Order ${currentOrder.id} confirmed`);
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Order processing failed", error.message);

    const orderId = event.data.order.id;

    await pool.query(
      `
      UPDATE orders
      SET status = $1,
          updated_at = NOW()
      WHERE id = $2
      `,
      ["FAILED", orderId]
    );

    await publishEvent(channel, "order.failed", "order.failed", {
      orderId,
      reason: error.message,
    });
  } finally {
    client.release();
  }
}

async function startWorker() {
  await connectPostgres();

  const connection = await amqp.connect(process.env.RABBITMQ_URL);
  const channel = await connection.createChannel();

  await channel.assertExchange(EXCHANGE_NAME, "topic", {
    durable: true,
  });

  await channel.assertQueue(QUEUE_NAME, {
    durable: true,
  });

  await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, "order.created");

  channel.prefetch(1);

  console.log("Order processor waiting for order.created events");

  channel.consume(QUEUE_NAME, async (message) => {
    if (!message) {
      return;
    }

    try {
      const event = JSON.parse(message.content.toString());

      await processOrder(event, channel);

      channel.ack(message);
    } catch (error) {
      console.error("Unexpected worker failure", error);
      channel.nack(message, false, false);
    }
  });
}

startWorker().catch((error) => {
  console.error("Order processor worker failed", error);
  process.exit(1);
});
