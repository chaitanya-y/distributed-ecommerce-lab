import amqp from "amqplib";

let channel;

export async function connectRabbitMQ() {
  if (!process.env.RABBITMQ_URL) {
    throw new Error("RABBITMQ_URL is missing");
  }

  const connection = await amqp.connect(process.env.RABBITMQ_URL);
  channel = await connection.createChannel();

  await channel.assertExchange("order_events", "topic", {
    durable: true,
  });

  console.log("Connected to RabbitMQ");
}

export function getRabbitMQChannel() {
  if (!channel) {
    throw new Error("RabbitMQ channel is not initialized");
  }

  return channel;
}
