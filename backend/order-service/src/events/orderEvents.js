import { getRabbitMQChannel } from "../config/rabbitmq.js";

export function publishOrderCreated(order, items) {
  const channel = getRabbitMQChannel();

  const event = {
    eventType: "order.created",
    occurredAt: new Date().toISOString(),
    data: {
      order,
      items,
    },
  };

  channel.publish(
    "order_events",
    "order.created",
    Buffer.from(JSON.stringify(event)),
    {
      persistent: true,
      contentType: "application/json",
    }
  );
}
