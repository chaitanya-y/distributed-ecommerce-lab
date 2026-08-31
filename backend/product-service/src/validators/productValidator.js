import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().trim().min(1, "Description is required"),
  price: z.number().nonnegative("Price must be zero or greater"),
  category: z.string().trim().min(1, "Category is required"),
  stock: z.number().int().nonnegative("Stock must be zero or greater").default(0),
  imageUrl: z.string().url("Image URL must be valid").nullable().optional(),
  attributes: z.record(z.string()).optional(),
});

export const updateProductSchema = createProductSchema.partial().refine(
  (product) => Object.keys(product).length > 0,
  "At least one product field is required"
);

export const verifyProductsSchema = z.object({
  productIds: z.array(z.string().regex(/^[a-f\d]{24}$/i, "Invalid product ID"))
    .min(1)
    .max(100),
});
