import { Product } from "../models/Product.js";
import { createProductSchema } from "../validators/productValidator.js";
import { redisClient } from "../config/redis.js";
import { indexProduct, searchProducts, } from "../services/productSearchService.js";



const PRODUCT_LIST_CACHE_KEY = "products:all";

export async function createProduct(req, res, next) {
  try {
    const validatedBody = createProductSchema.parse(req.body);


    const product = await Product.create(validatedBody);
    await indexProduct(product);
    await redisClient.del(PRODUCT_LIST_CACHE_KEY);
    res.status(201).json({
      message: "Product created",
      product,
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
