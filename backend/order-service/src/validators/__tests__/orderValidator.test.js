import { describe, expect, it } from "vitest";
import { createOrderSchema } from "../orderValidator.js";

describe("createOrderSchema", () => {
  it("accepts a valid order", () => {
    const result = createOrderSchema.parse({
      customerEmail: "test@example.com",
      items: [
        {
          productId: "product-1",
          productName: "Mechanical Keyboard",
          quantity: 2,
          unitPrice: 89.99,
        },
      ],
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toEqual({ productId: "product-1", quantity: 2 });
  });

  it("does not retain client-supplied catalog fields", () => {
    const result = createOrderSchema.parse({
      customerEmail: "test@example.com",
      items: [{
        productId: "product-1",
        quantity: 1,
        productName: "Forged name",
        unitPrice: 0.01,
      }],
    });

    expect(result.items[0]).not.toHaveProperty("productName");
    expect(result.items[0]).not.toHaveProperty("unitPrice");
  });

  it("rejects an empty cart", () => {
    expect(() => {
      createOrderSchema.parse({
        customerEmail: "test@example.com",
        items: [],
      });
    }).toThrow();
  });

  it("rejects an invalid email", () => {
    expect(() => {
      createOrderSchema.parse({
        customerEmail: "not-an-email",
        items: [
          {
            productId: "product-1",
            productName: "Mechanical Keyboard",
            quantity: 1,
            unitPrice: 89.99,
          },
        ],
      });
    }).toThrow();
  });
});
