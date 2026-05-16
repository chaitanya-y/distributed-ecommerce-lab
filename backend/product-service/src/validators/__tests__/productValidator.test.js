import { describe, expect, it } from "vitest";
import { createProductSchema } from "../productValidator.js";

describe("createProductSchema", () => {
  it("accepts a valid product", () => {
    const result = createProductSchema.parse({
      name: "Mechanical Keyboard",
      description: "RGB keyboard",
      price: 89.99,
      category: "electronics",
      stock: 10,
      attributes: {
        switch: "blue",
      },
    });

    expect(result.name).toBe("Mechanical Keyboard");
  });

  it("rejects negative price", () => {
    expect(() => {
      createProductSchema.parse({
        name: "Bad Product",
        description: "Invalid",
        price: -1,
        category: "test",
        stock: 1,
      });
    }).toThrow();
  });
});
