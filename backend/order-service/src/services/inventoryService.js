export class InventoryError extends Error {
  constructor(message) {
    super(message);
    this.name = "InventoryError";
    this.status = 409;
  }
}

export function consolidateItems(items) {
  const quantities = new Map();
  for (const item of items) {
    const productId = item.productId || item.product_id;
    quantities.set(productId, (quantities.get(productId) || 0) + item.quantity);
  }
  return [...quantities.entries()]
    .map(([productId, quantity]) => ({ productId, quantity }))
    .sort((a, b) => a.productId.localeCompare(b.productId));
}

// The predicate and increment happen in one statement. This is safe across
// concurrent checkout requests without an application-level read/modify/write.
export async function reserveInventory(client, items) {
  for (const item of consolidateItems(items)) {
    const result = await client.query(
      `
        UPDATE inventory
        SET reserved = reserved + $1,
            updated_at = NOW()
        WHERE product_id = $2
          AND stock - reserved >= $1
        RETURNING product_id, stock, reserved
      `,
      [item.quantity, item.productId]
    );

    if (result.rows.length === 0) {
      throw new InventoryError(`Insufficient stock for product ${item.productId}`);
    }
  }
}

export async function finalizeInventorySale(client, items) {
  for (const item of consolidateItems(items)) {
    const result = await client.query(
      `
        UPDATE inventory
        SET stock = stock - $1,
            reserved = reserved - $1,
            updated_at = NOW()
        WHERE product_id = $2
          AND reserved >= $1
          AND stock >= $1
        RETURNING product_id
      `,
      [item.quantity, item.productId]
    );

    if (result.rows.length === 0) {
      throw new InventoryError(`Reservation not found for product ${item.productId}`);
    }
  }
}
