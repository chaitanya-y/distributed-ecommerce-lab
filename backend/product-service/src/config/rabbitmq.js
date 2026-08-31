import amqp from "amqplib";
import { randomUUID } from "node:crypto";

let channel;

export async function connectRabbitMQ() {
  if (!process.env.RABBITMQ_URL) {
    throw new Error("RABBITMQ_URL is missing");
  }

  const connection = await amqp.connect(process.env.RABBITMQ_URL);
  channel = await connection.createChannel();
  await channel.assertExchange("product_events", "topic", { durable: true });
  console.log("Product service connected to RabbitMQ");
}

export function publishProductUpserted(product, { stockChanged = true } = {}) {
  if (!channel) {
    throw new Error("RabbitMQ channel is not initialized");
  }

  const event = {
    eventId: randomUUID(),
    eventType: "product.upserted",
    occurredAt: new Date().toISOString(),
    data: {
      product: {
        id: product._id.toString(),
        name: product.name,
        price: product.price,
        ...(stockChanged ? { stock: product.stock } : {}),
        updatedAt: product.updatedAt.toISOString(),
      },
    },
  };

  channel.publish(
    "product_events",
    "product.upserted",
    Buffer.from(JSON.stringify(event)),
    { persistent: true, contentType: "application/json" }
  );
}
