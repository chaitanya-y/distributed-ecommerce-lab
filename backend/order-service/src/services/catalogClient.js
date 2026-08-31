const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || "http://localhost:4001";

export class CatalogError extends Error {
  constructor(message, status = 502) {
    super(message);
    this.name = "CatalogError";
    this.status = status;
  }
}

export async function verifyCatalogProducts(productIds) {
  let response;

  try {
    response = await fetch(`${PRODUCT_SERVICE_URL}/products/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productIds }),
      signal: AbortSignal.timeout(5000),
    });
  } catch (error) {
    throw new CatalogError(`Catalog verification is unavailable: ${error.message}`);
  }

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new CatalogError(body.message || "Catalog verification failed", response.status);
  }

  return body.products;
}
