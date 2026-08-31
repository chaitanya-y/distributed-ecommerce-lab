import { Product } from "../models/Product.js";
import {
  createProductSchema,
  updateProductSchema,
  verifyProductsSchema,
} from "../validators/productValidator.js";
import { redisClient } from "../config/redis.js";
import { indexProduct, searchProducts, } from "../services/productSearchService.js";
import { publishProductUpserted } from "../config/rabbitmq.js";



const PRODUCT_LIST_CACHE_KEY = "products:all";

export async function createProduct(req, res, next) {
  try {
    const validatedBody = createProductSchema.parse(req.body);


    const product = await Product.create(validatedBody);
    await indexProduct(product);
    await redisClient.del(PRODUCT_LIST_CACHE_KEY);
    publishProductUpserted(product);
    res.status(201).json({
      message: "Product created",
      product,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProduct(req, res, next) {
  try {
    const validatedBody = updateProductSchema.parse(req.body);
    const product = await Product.findByIdAndUpdate(
      req.params.productId,
      validatedBody,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    await indexProduct(product);
    await redisClient.del(PRODUCT_LIST_CACHE_KEY);
    publishProductUpserted(product, {
      stockChanged: Object.hasOwn(validatedBody, "stock"),
    });

    return res.json({ message: "Product updated", product });
  } catch (error) {
    next(error);
  }
}

// Internal catalog contract used by Order Service. Prices and names from a cart
// are deliberately not accepted as the authoritative values.
export async function verifyProducts(req, res, next) {
  try {
    const { productIds } = verifyProductsSchema.parse(req.body);
    const uniqueIds = [...new Set(productIds)];
    const products = await Product.find({ _id: { $in: uniqueIds } });
    const byId = new Map(products.map((product) => [product._id.toString(), product]));
    const missingProductIds = uniqueIds.filter((id) => !byId.has(id));

    if (missingProductIds.length > 0) {
      return res.status(404).json({
        message: "One or more products no longer exist",
        missingProductIds,
      });
    }

    return res.json({
      products: uniqueIds.map((id) => {
        const product = byId.get(id);
        return {
          id,
          name: product.name,
          price: product.price,
          stock: product.stock,
          updatedAt: product.updatedAt,
        };
      }),
    });
  } catch (error) {
    next(error);
  }
}

export async function listProducts(req, res, next) {
  try {
    const cachedProducts = await redisClient.get(PRODUCT_LIST_CACHE_KEY);

    if (cachedProducts) {
      return res.json({
        source: "cache",
        products: JSON.parse(cachedProducts),
      });
    }

    const products = await Product.find().sort({ createdAt: -1 });

    await redisClient.set(PRODUCT_LIST_CACHE_KEY, JSON.stringify(products), {
      EX: 60,
    });

    res.json({
      source: "database",
      products,
    });
  } catch (error) {
    next(error);
  }
}



export async function uploadProductImageForProduct(req, res, next) {
  try {
    const { productId } = req.params;

    if (!req.file) {
      return res.status(400).json({
        message: "Product image file is required",
      });
    }

    const imageUrl = `/uploads/${req.file.filename}`;

    const product = await Product.findByIdAndUpdate(
      productId,
      { imageUrl },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    await indexProduct(product);
    await redisClient.del(PRODUCT_LIST_CACHE_KEY);  
    publishProductUpserted(product, { stockChanged: false });

    return res.status(200).json({
      message: "Product image uploaded",
      product,
    });
  } catch (error) {
    next(error);
  }
}



export async function searchProductCatalog(req, res, next) {
  try {
    const query = req.query.q;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        message: "Search query is required",
      });
    }

    const normalizedQuery = query.trim().toLowerCase();
    const cacheKey = `products:search:${normalizedQuery}`;

    const cachedProducts = await redisClient.get(cacheKey);

    if (cachedProducts) {
      return res.status(200).json({
        source: "cache",
        products: JSON.parse(cachedProducts),
      });
    }


    const products = await searchProducts(normalizedQuery);
    await redisClient.set(cacheKey, JSON.stringify(products), {
      EX: 60,
    });


    return res.status(200).json({
      source: "elasticsearch",
      products,
    });

  } catch (error) {
    next(error);
  }
}
