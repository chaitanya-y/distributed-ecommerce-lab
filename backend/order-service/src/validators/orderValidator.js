import { z } from "zod";

export const createOrderSchema = z.object({
  customerEmail: z.string().email("Valid customer email is required"),
  items: z.array(
    z.object({
      productId: z.string().min(1, "Product ID is required"),
      quantity: z.number().int().positive("Quantity must be positive"),
    })
  ).min(1, "At least one item is required"),
});
