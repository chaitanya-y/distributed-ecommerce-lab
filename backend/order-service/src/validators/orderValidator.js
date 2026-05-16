import { z } from "zod";

export const createOrderSchema = z.object({
  customerEmail: z.string().email("Valid customer email is required"),
  items: z.array(
    z.object({
      productId: z.string().min(1, "Product ID is required"),
      productName: z.string().min(1, "Product name is required"),
      quantity: z.number().int().positive("Quantity must be positive"),
      unitPrice: z.number().nonnegative("Unit price must be zero or greater"),
    })
  ).min(1, "At least one item is required"),
});

