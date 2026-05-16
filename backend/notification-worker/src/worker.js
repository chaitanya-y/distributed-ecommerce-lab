import "dotenv/config";
import amqp from "amqplib";

const EXCHANGE_NAME = "order_events";
const QUEUE_NAME = "notification_order_status";

async function startWorker() {
  const connection = await amqp.connect(process.env.RABBITMQ_URL);
  const channel = await connection.createChannel();

  await channel.assertExchange(EXCHANGE_NAME, "topic", {
    durable: true,
  });

  await channel.assertQueue(QUEUE_NAME, {
    durable: true,
  });

  await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, "order.confirmed");
  await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, "order.failed");
  await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, "order.expired");


  console.log("Notification worker waiting for order status events");

  channel.consume(QUEUE_NAME, async (message) => {
    if (!message) {
      return;
    }

    const event = JSON.parse(message.content.toString());

    if (event.eventType === "order.confirmed") {
      console.log(
        `Fake email sent to ${event.data.customerEmail}: Your order ${event.data.orderId} is confirmed.`
      );
    }

    if (event.eventType === "order.failed") {
      console.log(
        `Fake failure email for order ${event.data.orderId}: ${event.data.reason}`
      );
    }

    if (event.eventType === "order.expired") {
  console.log(
    `Fake expiry email sent to ${event.data.customerEmail}: Your order ${event.data.orderId} expired.`
  );
}



    channel.ack(message);
  });
}

startWorker().catch((error) => {
  console.error("Notification worker failed", error);
  process.exit(1);
});
