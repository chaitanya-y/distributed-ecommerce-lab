import { pool } from "../config/db.js";
import { createOrderSchema } from "../validators/orderValidator.js";
import { publishOrderCreated } from "../events/orderEvents.js";

export async function createOrder(req, res, next) {
  const client = await pool.connect();

  try {
    const validatedBody = createOrderSchema.parse(req.body);
    const idempotencyKey = req.header("Idempotency-Key");

    if (!idempotencyKey) {
      return res.status(400).json({
        message: "Idempotency-Key header is required",
      });
    }

    await client.query("BEGIN");

    const existingKeyResult = await client.query(
      `
        SELECT order_id
        FROM order_idempotency_keys
        WHERE idempotency_key = $1
        `,
      [idempotencyKey]
    );

    if (existingKeyResult.rows.length > 0) {
      const existingOrderId = existingKeyResult.rows[0].order_id;

      const existingOrderResult = await client.query(
        "SELECT * FROM orders WHERE id = $1",
        [existingOrderId]
      );

      const existingItemsResult = await client.query(
        "SELECT * FROM order_items WHERE order_id = $1",
        [existingOrderId]
      );

      await client.query("COMMIT");

      return res.status(200).json({
        message: "Order already created for this idempotency key",
        order: existingOrderResult.rows[0],
        items: existingItemsResult.rows,
      });
    }


    const totalAmount = validatedBody.items.reduce((sum, item) => {
      return sum + item.quantity * item.unitPrice;
    }, 0);

    const orderResult = await client.query(
      `
      INSERT INTO orders (customer_email, status, total_amount)
      VALUES ($1, $2, $3)
      RETURNING *
      `,
      [validatedBody.customerEmail, "PENDING", totalAmount]
    );

    const order = orderResult.rows[0];

    const orderItems = [];

    for (const item of validatedBody.items) {
      const itemResult = await client.query(
        `
        INSERT INTO order_items (
          order_id,
          product_id,
          product_name,
          quantity,
          unit_price
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
        `,
        [
          order.id,
          item.productId,
          item.productName,
          item.quantity,
          item.unitPrice,
        ]
      );

      orderItems.push(itemResult.rows[0]);
    }
    await client.query(
      `
      INSERT INTO order_idempotency_keys (idempotency_key, order_id)
      VALUES ($1, $2)
      `,
      [idempotencyKey, order.id]
    );

    await client.query("COMMIT");

    publishOrderCreated(order, orderItems);

    return res.status(201).json({
      message: "Order created",
      order,
      items: orderItems,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    next(error);
  } finally {
    client.release();
  }
}

export async function getOrderById(req, res, next) {
  try {
    const { orderId } = req.params;

    const orderResult = await pool.query(
      "SELECT * FROM orders WHERE id = $1",
      [orderId]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    const itemsResult = await pool.query(
      "SELECT * FROM order_items WHERE order_id = $1",
      [orderId]
    );

    return res.status(200).json({
      order: orderResult.rows[0],
      items: itemsResult.rows,
    });
  } catch (error) {
    next(error);
  }
}
